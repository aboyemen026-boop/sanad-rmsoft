import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';

// Native capabilities bridge. The original Sanad app remains the application UI.
window.RMNative = {
  isNative: Capacitor.isNativePlatform(),
  async requestNotifications() {
    const local = await LocalNotifications.requestPermissions();
    let push = { receive: 'prompt' };
    try {
      const current = await PushNotifications.checkPermissions();
      push = current.receive === 'granted' ? current : await PushNotifications.requestPermissions();
    } catch (_) {}
    return { local, push };
  },
  async testNotification() {
    const p = await LocalNotifications.requestPermissions();
    if (p.display !== 'granted') throw new Error('لم يتم منح إذن الإشعارات');
    await LocalNotifications.schedule({ notifications: [{ id: 731, title: 'سند — RM SOFT', body: 'إشعارات التطبيق تعمل على هذا الجهاز.', schedule: { at: new Date(Date.now() + 1500) } }] });
  },
  async checkBiometric() { return await BiometricAuth.checkBiometry(); },
  async testBiometric() {
    const info = await BiometricAuth.checkBiometry();
    if (!info.isAvailable) throw new Error(info.reason || 'البصمة غير متاحة أو لم يتم تسجيلها في إعدادات الهاتف');
    await BiometricAuth.authenticate({ reason: 'تأكيد هويتك داخل سند', allowDeviceCredential: true, androidTitle: 'تأكيد الهوية', androidSubtitle: 'استخدم بصمة الإصبع أو قفل الجهاز' });
    return true;
  },
  async registerPush() {
    const p = await PushNotifications.requestPermissions();
    if (p.receive !== 'granted') throw new Error('إذن الإشعارات غير ممنوح');
    await PushNotifications.register();
    return new Promise((resolve, reject) => {
      let done = false;
      const timeout = setTimeout(() => { if (!done) { done = true; reject(new Error('لم يصل رمز FCM؛ تحقق من إعداد Firebase وملف google-services.json')); } }, 15000);
      PushNotifications.addListener('registration', token => { if (!done) { done = true; clearTimeout(timeout); resolve(token.value); } });
      PushNotifications.addListener('registrationError', err => { if (!done) { done = true; clearTimeout(timeout); reject(err); } });
    });
  }
};

function showNativeTools() {
  if (!Capacitor.isNativePlatform() || document.getElementById('rm-native-tools')) return;
  const style = document.createElement('style');
  style.textContent = `#rm-native-tools{position:fixed;z-index:999999;bottom:18px;left:12px;font-family:inherit;direction:rtl}#rm-native-tools button{border:1px solid #c5a85d;background:#121a32;color:#fff;border-radius:14px;padding:10px 13px;font-size:13px;box-shadow:0 4px 18px #0008}#rm-native-panel{display:none;position:fixed;z-index:1000000;inset:0;background:#000b;align-items:flex-end;direction:rtl;font-family:inherit}#rm-native-panel .inner{background:#10182d;color:white;border-radius:22px 22px 0 0;padding:22px;width:100%;box-sizing:border-box}#rm-native-panel button{display:block;width:100%;margin:9px 0;padding:13px;border:1px solid #48516b;border-radius:12px;background:#1b2540;color:white;font-size:15px}#rm-native-panel .close{background:#d9b653;color:#151515;font-weight:bold}`;
  document.head.append(style);
  const wrap=document.createElement('div'); wrap.id='rm-native-tools';
  wrap.innerHTML=`<button id="rm-native-open">إعدادات الجهاز</button><div id="rm-native-panel"><div class="inner"><h3>إعدادات سند على الهاتف</h3><p>إدارة أذونات أندرويد والبصمة والإشعارات.</p><button data-act="notify">طلب إذن الإشعارات</button><button data-act="testnotify">إرسال إشعار تجريبي</button><button data-act="bio">فحص البصمة</button><button data-act="testbio">اختبار البصمة / قفل الجهاز</button><button data-act="push">تسجيل إشعارات Push</button><button class="close" data-act="close">إغلاق</button><small id="rm-native-status" style="color:#cbd2e6;line-height:1.8"></small></div></div>`;
  document.body.append(wrap);
  const panel=document.getElementById('rm-native-panel'), status=document.getElementById('rm-native-status');
  document.getElementById('rm-native-open').onclick=()=>panel.style.display='flex';
  wrap.querySelectorAll('[data-act]').forEach(b=>b.onclick=async()=>{const a=b.dataset.act;if(a==='close'){panel.style.display='none';return;}status.textContent='جارٍ التنفيذ…';try{let result;if(a==='notify')result=await window.RMNative.requestNotifications();if(a==='testnotify'){await window.RMNative.testNotification();result='تم جدولة إشعار تجريبي بعد ثانية ونصف.';}if(a==='bio'){result=await window.RMNative.checkBiometric();}if(a==='testbio'){await window.RMNative.testBiometric();result='تم التحقق بنجاح.';}if(a==='push'){const token=await window.RMNative.registerPush();result='تم تسجيل FCM. الرمز: '+token;}status.textContent=typeof result==='string'?result:JSON.stringify(result,null,2);}catch(e){status.textContent='تعذر التنفيذ: '+(e?.message||String(e));}});
}
if (Capacitor.isNativePlatform()) {
  document.addEventListener('DOMContentLoaded', showNativeTools);
  if (document.readyState !== 'loading') showNativeTools();
}
