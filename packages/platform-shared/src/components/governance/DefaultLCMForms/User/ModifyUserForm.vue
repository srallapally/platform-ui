<!-- Copyright (c) 2025 ForgeRock. All rights reserved.

This software may be modified and distributed under the terms
of the MIT license. See the LICENSE file for details. -->
<template>
  <div>
    <FrSpinner
      v-if="loading"
      class="py-5" />
    <FrFormGenerator
      v-else
      :default-value-for-integer="null"
      :schema="schemaFormGenerator"
      :model="modelValue"
      @update:model="fieldChanged">
      <template #objectSelect="{ property }">
        <FrGovObjectSelect
          class="pb-1 mb-4"
          :property="property"
          @update:model="fieldChanged" />
      </template>
    </FrFormGenerator>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { showErrorMessage } from '@forgerock/platform-shared/src/utils/notification';
import { convertRelationshipPropertiesToFormBuilder } from '@forgerock/platform-shared/src/components/FormEditor/utils/formGeneratorSchemaTransformer';
import { useGovernanceStore } from '@forgerock/platform-shared/src/stores/governance';
import { getResourceTypePrivilege } from '@forgerock/platform-shared/src/api/PrivilegeApi';
import FrFormGenerator from '@forgerock/platform-shared/src/components/FormGenerator';
import FrGovObjectSelect from '@forgerock/platform-shared/src/components/FormEditor/components/governance/GovObjectSelect';
import FrSpinner from '@forgerock/platform-shared/src/components/Spinner';
import i18n from '@/i18n';

const props = defineProps({
  allowAllProperties: {
    type: Boolean,
    default: false,
  },
  readOnly: {
    type: Boolean,
    default: false,
  },
  user: {
    type: Object,
    required: true,
  },
});

const { schema, setSchema } = useGovernanceStore();
const loading = ref(true);
const modelValue = ref({});
const schemaFormGenerator = ref([]);

const emit = defineEmits(['update:modelValue']);

function getType(property) {
  switch (property.type) {
    case 'relationship':
      return 'managedObject';
    case 'number':
      return 'integer';
    default:
      return property.type;
  }
}

/**
 * Filters the provided schema data based on privilege and user data.
 *
 * @param {Object} schemaData - The user schema
 * @param {Object} privilegeData - The privileges for the specific user object
 * @param {Object} userObject - The user object.
 * @returns {Object} - The filtered schema data used to render the form.
 */
function getFilteredSchema(schemaData, privilegeData, userObject) {
  if (!schemaData.properties || !privilegeData.VIEW?.allowed) {
    return [];
  }

  const hideFields = [
    '_id',
    'pushDeviceProfiles',
    'deviceProfiles',
    'devicePrintProfiles',
    'oathDeviceProfiles',
    'webauthnDeviceProfiles',
    'preferences',
  ];

  const tempSchema = privilegeData.VIEW.properties.map((key) => {
    const property = schemaData.properties[key];
    if (!property.viewable) return null;
    if (property.isVirtual) return null;
    if (hideFields.includes(key)) return null;
    if (property.type === 'array' && property.items?.type === 'relationship') return null;

    const formProperty = {
      type: getType(property),
      label: property.title,
      model: key,
      property,
      value: userObject[key],
      disabled: props.readOnly || !privilegeData.UPDATE?.properties?.includes(key),
    };

    // need to check for alpha_user only
    if (property.type === 'relationship') {
      // Handle object relationships
      formProperty.type = 'select';
      formProperty.customSlot = 'objectSelect';
      formProperty.options = { object: 'user' };
    }

    return formProperty;
  }).filter((property) => property !== null);

  // split into two columns
  const newArray = [];
  const size = 2;
  while (tempSchema.length > 0) newArray.push(tempSchema.splice(0, size));
  return newArray;
}

/**
 * Load the user schema and privileges necessary for rendering the form.
 */
async function loadSchema() {
  try {
    await setSchema('managed/alpha_user');
    let privilegeData = {};

    if (props.allowAllProperties) {
      privilegeData = {
        VIEW: { allowed: true, properties: schema['managed/alpha_user'].order },
        UPDATE: { allowed: true, properties: schema['managed/alpha_user'].order },
      };
    } else {
      const res = await getResourceTypePrivilege(`managed/alpha_user/${props.user._id}`);
      privilegeData = res.data;
    }

    const convertedUser = convertRelationshipPropertiesToFormBuilder(props.user, schema['managed/alpha_user'].properties);
    schemaFormGenerator.value = getFilteredSchema(schema['managed/alpha_user'], privilegeData, convertedUser);
  } catch (error) {
    showErrorMessage(error, i18n.global.t('governance.user.errorGettingSchema'));
  } finally {
    loading.value = false;
  }
}

/**
 * Handles the event triggered when a field value changes in the form.
 *
 * @param {Event} event - The event object containing details about the field change.
 */
function fieldChanged(event) {
  if (schema['managed/alpha_user'].properties[event.path].type === 'number' && event.value === 0) {
    modelValue.value[event.path] = null;
    return;
  }
  modelValue.value[event.path] = event.value;
  emit('update:modelValue', modelValue.value);
}

loadSchema();
</script>
