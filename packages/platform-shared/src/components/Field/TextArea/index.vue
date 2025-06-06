<!-- Copyright (c) 2020-2025 ForgeRock. All rights reserved.

This software may be modified and distributed under the terms
of the MIT license. See the LICENSE file for details. -->
<template>
  <FrInputLayout
    :id="internalId"
    :name="name"
    :description="description"
    :errors="combinedErrors"
    :is-html="isHtml"
    :label="label"
    :show-length-count="showLengthCount"
    :current-length="inputValue?.length"
    :max-length="maxLength"
    :floating-label="floatingLabel">
    <textarea
      :value="inputValue"
      @input="inputValue = $event.target.value; $emit('input', inputValue)"
      v-on="validationListeners"
      :autofocus="autofocus"
      :class="[{'polyfill-placeholder': floatLabels }, 'form-control', 'mh-50px', addClass]"
      :cols="cols"
      :data-vv-as="label"
      :disabled="disabled"
      :id="internalId"
      :name="name"
      :placeholder="floatingLabel ? false : placeholder"
      :rows="rows"
      :max-rows="maxRows"
      :readonly="readonly"
      :data-testid="testid"
      @click="onClick"
      @blur="inputValueHandler(inputValue)" />
    <template #defaultButtons>
      <BInputGroupAppend v-if="copy">
        <button
          :id="`copyButton-${value}`"
          :data-testid="`btn-copy-${testid}`"
          class="btn btn-outline-secondary"
          name="copyButton"
          @click.prevent="copyValueToClipboard(value)">
          <FrIcon name="copy" />
        </button>
        <BTooltip
          :target="`copyButton-${value}`"
          placement="top"
          triggers="hover"
          :title="$t('common.copy')" />
      </BInputGroupAppend>
    </template>
    <template
      v-for="(key, slotName) in $slots"
      #[slotName]="slotData">
      <!-- @slot passthrough slot -->
      <slot
        :name="slotName"
        v-bind="slotData" />
    </template>
  </FrInputLayout>
</template>

<script>
import { useField } from 'vee-validate';
import uuid from 'uuid/v4';
import { ref, toRef, watch } from 'vue';
import * as clipboard from 'clipboard-polyfill/text';
import FrIcon from '@forgerock/platform-shared/src/components/Icon';
import NotificationMixin from '@forgerock/platform-shared/src/mixins/NotificationMixin/';
import { BInputGroupAppend, BTooltip } from 'bootstrap-vue';
import { debounce } from 'lodash';
import FrInputLayout from '../Wrapper/InputLayout';
import InputMixin from '../Wrapper/InputMixin';

/**
 *  Text area input
 *
 *  @Mixes InputMixin - default props and methods for inputs
 *  @param {String} value default ''
 */
export default {
  name: 'TextArea',
  mixins: [
    InputMixin,
    NotificationMixin,
  ],
  components: {
    BInputGroupAppend,
    BTooltip,
    FrIcon,
    FrInputLayout,
  },
  props: {
    /**
     * specifies the visible height of a text area, in lines.
     */
    rows: {
      type: Number,
      default: 3,
    },
    /**
     * specifies the visible width of a text area.
     */
    cols: {
      type: Number,
      default: 10,
    },
    /**
     * Specifies whether to show an input length count under the text area
     */
    showLengthCount: {
      type: Boolean,
      default: false,
    },
    /**
     * Specifies the max length to show in the input count
     */
    maxLength: {
      type: Number,
      default: 500,
    },
    addClass: {
      type: String,
      default: '',
    },
    /**
     * Specifies the maximum number of rows the textarea will grow to in order to fit content
     */
    maxRows: {
      type: Number,
      default: null,
    },
    testid: {
      type: String,
      default: '',
    },
    /**
     * Determines if copy button should be appended to field
     */
    copy: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const {
      value: inputValue, errors: fieldErrors, handleBlur, validate,
    } = useField(() => `${props.name}-id-${uuid()}`, toRef(props, 'validation'), {
      validateOnMount: props.validationImmediate, initialValue: '', bails: false, validateOnValueUpdate: false,
    });
    const wasInvalid = ref(false); // Track invalid state
    const debouncedValidate = debounce(validate, 250);

    // Watch input changes: Validate aggressively if previously invalid
    watch(inputValue, () => {
      if (wasInvalid.value) {
        debouncedValidate();
      }
    });

    // Watch errors to transition between validation modes
    watch(fieldErrors, (newErrors) => {
      if (newErrors.length === 0) {
        wasInvalid.value = false; // Reset to eager validation
      } else {
        wasInvalid.value = true; // Stay aggressive while invalid
      }
    });

    // validationListeners: Contains custom event listeners for validation.
    // Since vee-validate +4 removes the interaction modes, this custom listener is added
    // to validate on blur to perform a similar aggressive validation in addition to the validateOnValueUpdate.
    const validationListeners = {
      blur: (evt) => {
        handleBlur(evt, true);
        validate(); // Validate immediately on blur
        wasInvalid.value = fieldErrors.value.length > 0;
      },
    };

    return { inputValue, fieldErrors, validationListeners };
  },
  methods: {
    /**
     * Handler for clicking the text area. Floats the label if possible
     */
    onClick() {
      if (this.label && !this.readonly && this.floatingLabel) {
        this.floatLabels = true;
      }
    },
    /**
    * Default inputValueHandler method.
    *
    * @param {Array|Object|Number|String} inputValue value to be set for internal model
    */
    inputValueHandler(inputValue) {
      if (inputValue !== null && this.floatingLabel) {
        this.floatLabels = inputValue.toString().length > 0 && !!this.label;
      }
    },
    /**
     * Copy field value to clipboard
     *
     * @param {String} payload string to copy
     */
    copyValueToClipboard(payload) {
      clipboard.writeText(payload).then(() => {
        this.displayNotification('success', this.$t('common.copySuccess'));
      }, (error) => {
        this.showErrorMessage(error, this.$t('common.copyFail'));
      });
    },
  },
  computed: {
    combinedErrors() {
      return this.errors.concat(this.fieldErrors);
    },
  },
};
</script>

<style lang="scss" scoped>
  .mh-50px {
    min-height: 50px;
  }
</style>
