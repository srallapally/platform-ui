<!-- Copyright 2025 ForgeRock AS. All Rights Reserved

Use of this code requires a commercial software license with ForgeRock AS
or with one of its affiliates. All use shall be exclusively subject
to such license between the licensee and ForgeRock AS. -->
<template>
  <div>
    <BImg
      v-if="imageFound"
      :src="src"
      :width="width"
      :height="width"
      :alt="alt" />
    <span
      v-else
      class="icon-holder p-2 d-flex bg-light border rounded">
      <FrIcon
        :icon-class="`md-24 text-dark mt-auto ${inputClass}`"
        :name="fallback" />
    </span>
  </div>
</template>

<script>
import axios from 'axios';
import FrIcon from '@forgerock/platform-shared/src/components/Icon';

/**
 * @description Component that will load an image and if the image fails to load it will display a fallback image rather than loading nothing
 *
 * */
export default {
  name: 'ImageFallback',
  components: {
    FrIcon,
  },
  props: {
    inputClass: {
      type: String,
      default: () => '',
    },
    src: {
      type: String,
      default: () => '',
    },
    width: {
      type: [String, Number],
      default: () => '',
    },
    alt: {
      type: String,
      default: () => '',
    },
    fallback: {
      type: String,
      default: () => '',
    },
  },
  data() {
    return {
      imageFound: false,
    };
  },
  mounted() {
    if (this.src) {
      axios.get(`${this.src}`).then(({ status }) => {
        this.imageFound = status === 200;
      }).catch((error) => {
        if (error) {
          this.imageFound = false;
        }
      });
    } else {
      this.imageFound = false;
    }
  },
};
</script>

<style language="scss" scoped>
.icon-holder {
  min-height: 2.28rem;
  min-width: 2.28rem;
}
</style>
