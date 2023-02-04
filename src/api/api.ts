import { BatteryInfo, RectifierInfo } from '@/protos/messages'

const apiUrl = "http://192.168.1.115:8000";

export async function fetchApi(url: string, abort?: AbortSignal): Promise<Uint8Array | null> {
    if (!url.startsWith('/')) {
        url = '/' + url;
    }
    let resp;
    try {
        resp = await fetch(apiUrl + url, { signal: abort });
    } catch (ex) {
        return null;
    }
    if (resp.status == 503) {
        return null;
    } else {
        return new Uint8Array(await resp.arrayBuffer());
    }
}

export async function getBatteryInfo(abort?: AbortSignal): Promise<BatteryInfo | null> {
    const resp = await fetchApi("/query/battery", abort);
    if (resp !== null) {
        const info = BatteryInfo.fromBinary(resp);
        return info;
    }
    return null;
}

export async function getRectifierInfo(abort?: AbortSignal): Promise<RectifierInfo | null> {
    const resp = await fetchApi("/query/rectifier", abort);
    if (resp !== null) {
        const info = RectifierInfo.fromBinary(resp);
        return info;
    }
    return null;
}