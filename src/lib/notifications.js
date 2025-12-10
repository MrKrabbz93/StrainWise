import { LocalNotifications } from '@capacitor/local-notifications';

export const scheduleDailyTip = async () => {
    try {
        const perm = await LocalNotifications.checkPermissions();
        if (perm.display !== 'granted') {
            const req = await LocalNotifications.requestPermissions();
            if (req.display !== 'granted') return false;
        }

        await LocalNotifications.schedule({
            notifications: [
                {
                    title: "StrainWise Daily Tip",
                    body: "Discover a new strain today! The AI Sommelier has fresh picks for you.",
                    id: 1,
                    schedule: {
                        every: 'day',
                        allowWhileIdle: true
                    },
                    sound: null,
                    attachments: null,
                    actionTypeId: "",
                    extra: null
                }
            ]
        });
        return true;
    } catch (e) {
        console.warn("Notifications not supported (likely running in browser)", e);
        return false;
    }
};
