/*global Dingdocs*/

import { API_CONFIG, DINGTALK_CONFIG } from '../config/api.ts';

/**
 * 生成随机字符串
 */
function generateNonceStr(length: number = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 获取钉钉权限签名
 */
async function getSignature(url: string, nonceStr: string, timeStamp: number): Promise<string> {
  const signUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DINGTALK_SIGN}`;

  console.log('[权限] 请求签名:', { url, nonceStr, timeStamp, signUrl });

  const response = await fetch(signUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url,
      nonceStr,
      timeStamp,
      agentId: DINGTALK_CONFIG.AGENT_ID,
      corpId: DINGTALK_CONFIG.CORP_ID
    })
  });

  console.log('[权限] 签名响应状态:', response.status);

  if (!response.ok) {
    throw new Error(`获取签名失败: ${response.status}`);
  }

  const result = await response.json();
  console.log('[权限] 签名响应数据:', result);

  if (result.code !== 0) {
    throw new Error(result.msg || '获取签名失败');
  }

  console.log('[权限] 获取到签名:', result.signature);
  return result.signature;
}

/**
 * 配置钉钉权限
 */
export async function configDingdocsPermission(): Promise<void> {
  console.log('[权限] 开始配置钉钉权限');

  const url = window.location.href;
  const nonceStr = generateNonceStr();
  const timeStamp = Date.now();

  console.log('[权限] 配置参数:', { url, nonceStr, timeStamp });

  const signature = await getSignature(url, nonceStr, timeStamp);

  console.log('[权限] 调用 configPermission');
  await Dingdocs.base.host.configPermission(
    DINGTALK_CONFIG.AGENT_ID,
    DINGTALK_CONFIG.CORP_ID,
    timeStamp,
    nonceStr,
    signature,
    ['DingdocsScript.base.readWriteAll']
  );

  console.log('[权限] 权限配置成功');
}
