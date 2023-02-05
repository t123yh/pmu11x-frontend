const alarmData = `
//#byte_idx#bit_idx#style#ZH_txt#EN_txt
//style说明,第一位：0-protection，1-alarm，2-status，3-other;第二位：0-voltage，1-current，2-temp，3-other
#0#0#12#Mos温度故障#Mos_NTC_Errir
#0#1#13#陀螺仪模块通信超时#Gryoscope_Error
#0#2#03#陀螺仪上锁#Gryoscope_Lock
#0#3#13#限流板损坏#LiminCurrent_Error
#0#4#10#电压采样线断开#Voltage_Line_Break
#0#5#13#充电MOS损坏#Charge_MOS_Error
#0#6#13#放电MOS损坏#Discharge_MOS_Error
#0#7#10#电压采样元件损坏#Voltage_IC_Error
//------
#1#0#12#温度传感器断线#NTC_Line_Break
#1#1#13#电流采样元件损坏#ADC_Module_Error
#1#2#03#充电器反接#Charge_Dev_Reverse
#1#3#00#单体过低#Cell_low_Vol
#1#4
#1#5
#1#6
#1#7#13#通信超时上锁#Com_On_Lock
//------
#2#0#02#放电过温#Discharge_Over_Temp
#2#1#02#放电欠温#Discharge_Under_Temp
#2#2#00#总体过压#Pack_Over_Voltage
#2#3#03#启动失败#Start_Error
#2#4#23#充电MOS断开#Charge_MOS_Open
#2#5#23#放电MOS断开#Discharge_MOS_Open
#2#6#03#536通信超时#536_Communication_Error
#2#7#00#总体欠压#Pack_Under_Voltage
//------
#3#0#20#正在充电#Charging
#3#1#20#正在放电#Discharging
#3#2#03#短路#Short_Current
#3#3#03#过流保护#Over_Current
#3#4#00#单体过压#Cell_Over_Vol
#3#5#00#单体欠压#Cell_Under_Vol
#3#6#02#充电过温#Charge_Over_Temp
#3#7#02#充电欠温#Charge_Under_Temp
//------
#4#0#02#环境低温#Env_UT
#4#1#13#失效干接点动作#Invalid_DryContact_Action
#4#2#13#严重干接点动作#Serious_DryContact_Action
#4#3#
#4#4#
#4#5#00#单体电压失效#Cell_Volt_Invalid
#4#6#10#总体电压失效#Pack_Volt_Invalid
#4#7#00#单体压差过大#Cell_Vol_Diff 
//------
#5#0#
#5#1#
#5#2#
#5#3#
#5#4#12#加热垫开启#Heat_Pad_ON
#5#5#02#MOSFET过温#MOS_Over_Temp
#5#6#02#MOSFET欠温#MOS_Under_Temp
#5#7#12#充电开启温度过低#Start_Chg_Temp_Low
//------
#6#0#01#充电过流#Charge_Over_Current
#6#1#21#限流充电#limit_Charge_Current
#6#2#01#放电过流#Discharge_Over_Current
#6#3#13#脱扣器断开#Exter_Relay_Break
#6#4#02#环境高温保护#ENV_Over_Temp
#6#5#02#环境低温保护#ENV_Under_Temp
#6#6#
#6#7#
//------
#7#0#13#SOC过低2#SOC_Low_Alarm2
#7#1#
#7#2#
#7#3#
#7#4#
#7#5#
#7#6#
#7#7#
//------
#8#0#12#环境过温#Env_Over_Temp
#8#1#12#环境欠温#Env_Under_Temp
#8#2#12#PCB过温#PCB_Over_Temp
#8#3#13#容量过低#Low_Capacity
#8#4#10#单体压差过大#Cell_Vol_Diff
#8#5#12#MOSFE过温#MOS_Over_Temp
#8#6#
#8#7#
//------
#9#0#10#单体过压#Cell_Over_Vol
#9#1#10#单体欠压#Cell_Under_Vol
#9#2#10#总体过压#Pack_Over_Vol
#9#3#10#总体欠压#Pack_Under_Vol
#9#4#11#充过流#Charge_Over_Current
#9#5#11#放过流#Discharge_Over_Current
#9#6#12#电池过温#Cell_Chg_OT
#9#7#12#电池欠温#Cell_Chg_UT
//------
#10#0#12#充电高温#Charge_Over_Temp
#10#1#12#充电低温#Charge_Under_Temp
#10#2#12#放电高温#Discharge_Over_Temp
#10#3#12#放电低温#Discharge_Under_Temp
#10#4#
#10#5#
#10#6#
#10#7#
//------
#11#0#
#11#1#
#11#2#
#11#3#
#11#4#
#11#5#
#11#6#
`

export enum Severity {
    Protection = 0,
    Alarm = 1,
    Status = 2,
    Other = 3
}

export enum Category {
    Voltage = 0,
    Current = 1,
    Temp = 2,
    Other = 3
}

export interface BatteryAlarm {
    name: string;
    severity: Severity;
    category: Category
}

export function parseBatteryAlarm(arr: Uint8Array): BatteryAlarm[] {
    const regex = /^#(?<byte>\d+)#(?<bit>\d)#(?<severity>\d)(?<category>\d)#(?<cn_name>.*?)#(?<en_name>.*?)$/gm;
    let m;

    let alarms: BatteryAlarm[] = [];

    while ((m = regex.exec(alarmData)) !== null) {
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }

        const g = m.groups;
        if (g) {
            const byte = Number(g.byte);
            const bit = Number(g.bit);
            if (arr[byte] & (1 << bit)) {
                alarms.push({
                    name: g.cn_name,
                    severity: Number(g.severity),
                    category: Number(g.category),
                });
            }
        }
    }

    return alarms;
}