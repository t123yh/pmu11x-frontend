<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, computed } from 'vue'
import { NButton, NCard, NGrid, NGridItem, NStatistic, NProgress, NTag, NCollapseItem, NCollapse, NIcon, NTooltip } from 'naive-ui'
import { Temperature16Regular, Battery020Filled } from '@vicons/fluent'
import { BatteryChargingFullFilled } from '@vicons/material'
import { BatteryInfo, RectifierInfo } from '@/protos/messages';
import { getBatteryInfo, getRectifierInfo } from '@/api/api';
import BatteryIcon from '@/components/BatteryIcon.vue';
import { parseBatteryAlarm, Severity } from '@/utils/BatteryParser';

const battInfo = ref(null as (BatteryInfo | null))
const rectifierInfo = ref(null as (RectifierInfo | null))
let abortController = new AbortController;

async function updateBatteryInfo() {
  battInfo.value = await getBatteryInfo(abortController.signal);
}

async function updateRectifierInfo() {
  rectifierInfo.value = await getRectifierInfo(abortController.signal);
}

let updating = ref(false);

async function updateInfo() {
  abortController.abort();
  abortController = new AbortController();
  updating.value = true;
  await Promise.all([updateBatteryInfo(), updateRectifierInfo()]);
  updating.value = false;
}

const updateBatteryInterval = setInterval(updateInfo, 1000);
onMounted(() => {
  updateInfo();
});

onBeforeUnmount(() => {
  abortController.abort();
  clearInterval(updateBatteryInterval);
});

const chargeLabel = computed(() => {
  if (battInfo.value) {
    if (battInfo.value.current < -0.01)
      return "充电";
    if (battInfo.value.current > 0.01)
      return "放电";
  }
  return '';
})

const batteryStatus = computed(() => {
  if (battInfo.value) {
    return parseBatteryAlarm(battInfo.value.alarm);
  }
  return [];
});

function severityToType(severity: Severity) {
  switch (severity) {
    case Severity.Protection:
      return "error";
    case Severity.Alarm:
      return "warning";
    case Severity.Status:
      return "info";
    case Severity.Other:
      return "default";
  }
}

</script>

<template>
  <n-grid cols="1 m:2 xl:3" x-gap="10" y-gap="10" responsive="screen">
    <n-grid-item span="1">
      <n-card title="电池状态">
        <div v-if="battInfo" class="info-card-content">
          <span class="status-tag">
            <n-tooltip trigger="hover">
              <template #trigger>
                <div class="status-tag-container">

            <n-tag v-for="status in batteryStatus" :type="severityToType(status.severity)">
              {{ status.name }}
            </n-tag>
                </div>
            </template>
            状态：{{ battInfo.alarm }}
            </n-tooltip>
          </span>
          <n-grid cols="2 s:4 m:2 l:4" responsive="screen">
            <n-grid-item>
              <n-statistic label="电压">
                {{ battInfo.voltageSum.toFixed(2) }}V
              </n-statistic>
            </n-grid-item>
            <n-grid-item>
              <n-statistic :label="chargeLabel + '电流'">
                {{ Math.abs(battInfo.current).toFixed(2) }}A
              </n-statistic>
            </n-grid-item>
            <n-grid-item>
              <n-statistic :label="chargeLabel + '功率'">
                {{ Math.abs(battInfo.current * battInfo.voltageSum).toFixed(0) }}W
              </n-statistic>
            </n-grid-item>
            <n-grid-item>
              <n-statistic label="循环次数">
                {{ battInfo.loop }}
              </n-statistic>
            </n-grid-item>
          </n-grid>
          <n-statistic label="电量">
            <span class="batt-cap-text" style="margin-right: 5px">
              <n-icon size="22" color="#0e7a0d" class="align-icon">
                <battery-icon :percentage="battInfo.soc" />
              </n-icon>
              <span class="align-text">
                {{ battInfo.soc.toFixed(1) }}%
              </span>
            </span>
            <span class="batt-cap-text align-text">
              ({{ (battInfo.fullCapacity * battInfo.soh * battInfo.soc / 10000.0).toFixed(2) }}Ah /
              {{ (battInfo.fullCapacity * battInfo.soh / 100.0).toFixed(2) }}Ah)
            </span>
          </n-statistic>
          <n-statistic label="温度">
            <n-grid cols="1 300:3 500:5" responsive="self">
              <n-grid-item v-for="(temp, index) in battInfo.temperatures">
                <n-icon size="22" color="#0e7a0d" class="align-icon">
                  <Temperature16Regular />
                </n-icon>
                <sub class="temperature-index">{{ index + 1 }}</sub>
                <span class="align-text"> {{ temp }}℃ </span>
              </n-grid-item>
            </n-grid>
          </n-statistic>
          <n-statistic label="电芯">
            <n-grid x-gap="12" y-gap="12" cols="1 250:2 300:3 400:4 600:6" responsive="self">
              <n-grid-item v-for="(cell, idx) in battInfo.cells">
                <div class="cell-div">
                  <div class="cell-content">
                    <div class="cell-status-container">
                      <n-icon size="16" class="align-icon">
                        <BatteryChargingFullFilled />
                      </n-icon>
                      <div class="align-text">
                        {{ idx + 1 }}
                      </div>
                      <div style="flex-grow:1;"></div>
                      <div class="align-text">
                        {{ cell.value.toFixed(3) }}V
                      </div>
                    </div>
                    <div class="cell-status-container">
                      <span :class="cell.overVoltage ? 'cell-status-overvoltage' : 'cell-status-none'">过压</span>
                      <span :class="cell.underVoltage ? 'cell-status-undervoltage' : 'cell-status-none'">欠压</span>
                      <span :class="cell.balance ? 'cell-status-balance' : 'cell-status-none'">均衡</span>
                    </div>
                  </div>
                </div>
              </n-grid-item>
            </n-grid>
          </n-statistic>
        </div>
        <div v-else>
          读取电池信息失败！
        </div>
      </n-card>
    </n-grid-item>
    <n-grid-item span="1">
      <n-card title="整流器状态">
        <div v-if="rectifierInfo" class="info-card-content">
          <span class="status-tag">
            <n-tooltip trigger="hover">
              <template #trigger>
                <n-tag type="warning" v-if="(rectifierInfo.alarmValue & (1 << 27))">
                  输入欠压
                </n-tag>
                <n-tag type="info" v-else-if="!(rectifierInfo.alarmValue & (1 << 17))">
                  工作中
                </n-tag>
                <n-tag type="default" v-else>
                  未工作
                </n-tag>
              </template>
              状态：{{ rectifierInfo.alarmValue }}
            </n-tooltip>
          </span>
          <n-grid cols="3" item-responsive responsive="self">
            <n-grid-item span="0 540:1">
              <n-statistic label="输入电压 / 频率">
                {{ rectifierInfo.inputVoltage.toFixed(1) }}V / {{ rectifierInfo.inputFrequency.toFixed(1) }}Hz
              </n-statistic>
            </n-grid-item>
            <n-grid-item span="1 540:0">
              <n-statistic label="输入电压">
                {{ rectifierInfo.inputVoltage.toFixed(1) }}V
              </n-statistic>
            </n-grid-item>
            <n-grid-item>
              <n-statistic label="输入电流">
                {{ rectifierInfo.inputCurrent.toFixed(2) }}A
              </n-statistic>
            </n-grid-item>
            <n-grid-item>
              <n-statistic label="输入功率">
                {{ rectifierInfo.inputPower.toFixed(0) }}W
              </n-statistic>
            </n-grid-item>
          </n-grid>
          <n-grid cols="3">
            <n-grid-item>
              <n-statistic label="输出电压">
                {{ rectifierInfo.outputVoltage.toFixed(2) }}V
              </n-statistic>
            </n-grid-item>
            <n-grid-item>
              <n-statistic label="输出电流">
                {{ rectifierInfo.outputCurrent.toFixed(2) }}A
              </n-statistic>
            </n-grid-item>
            <n-grid-item>
              <n-statistic label="输出功率">
                {{ rectifierInfo.outputPower.toFixed(0) }}W
              </n-statistic>
            </n-grid-item>
          </n-grid>
          <n-grid cols="3">
            <n-grid-item>
              <n-statistic label="输入模块温度">
                <n-icon size="22" color="#0e7a0d" class="align-icon">
                  <Temperature16Regular />
                </n-icon>
                <span class="align-text">{{ rectifierInfo.inputModuleTemp.toFixed(0) }}℃</span>
              </n-statistic>
            </n-grid-item>
            <n-grid-item>
              <n-statistic label="输出模块温度">
                <n-icon size="22" color="#0e7a0d" class="align-icon">
                  <Temperature16Regular />
                </n-icon>
                <span class="align-text">{{ rectifierInfo.outputModuleTemp.toFixed(0) }}℃</span>
              </n-statistic>
            </n-grid-item>
            <n-grid-item>
              <n-statistic label="效率">
                {{ (rectifierInfo.efficiency * 100).toFixed(1) }}%
              </n-statistic>
            </n-grid-item>
          </n-grid>
        </div>
        <div v-else>
          读取整流器信息失败！
        </div>
      </n-card>
    </n-grid-item>
  </n-grid>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}

.info-card-content {
  font-variant-numeric: tabular-nums;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.status-tag {
  position: absolute;
  top: 10px;
  right: 10px;
}

.status-tag-container {
  display: flex;
  flex-direction: row;
  gap: 7px;
}

.cell-div {
  width: 100%;
  display: block;
  border-style: solid;
  border-width: thin;
  border-color: #888;
  border-radius: 3px;
}

.cell-content {
  padding: 5px;
  font-size: 14px;
}

.cell-status-container {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  align-items: center;
}

.cell-status-none {
  color: lightgray;
}

.cell-status-overvoltage {
  border: solid;
  border-width: thin;
  border-color: red;
  color: red;
}

.cell-status-undervoltage {
  border: solid;
  border-width: thin;
  border-color: red;
  color: red;
}

.cell-status-balance {
  outline: 1px solid blue;
  color: blue;
}

.align-icon,
.align-text {
  vertical-align: middle;
  display: inline-block;
}

.temperature-index {
  position: relative;
  right: 6px;
  font-size: 13px;
  color: #0e7a0d;
}

.batt-cap-text {
  display: inline-block;
}
</style>
