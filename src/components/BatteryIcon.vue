<script setup lang="ts">
import { Battery20Round, Battery30Round, Battery50Round, Battery60Round, Battery80Round, Battery90Round, BatteryFullRound } from '@vicons/material'
const props = defineProps<{ percentage: Number }>()
</script>

<template>
    <Battery20Round v-if="props.percentage < 20"></Battery20Round>
    <Battery30Round v-else-if="props.percentage < 30"></Battery30Round>
    <Battery50Round v-else-if="props.percentage < 50"></Battery50Round>
    <Battery60Round v-else-if="props.percentage < 60"></Battery60Round>
    <Battery80Round v-else-if="props.percentage < 80"></Battery80Round>
    <Battery90Round v-else-if="props.percentage < 95"></Battery90Round>
    <BatteryFullRound v-else></BatteryFullRound>
</template>