import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    return (
        <div className="flex items-center gap-2 bg-slate-800 rounded-full p-1 border border-slate-700">
            <Globe className="w-4 h-4 text-slate-400 ml-2" />
            <select
                value={i18n.resolvedLanguage}
                onChange={(e) => changeLanguage(e.target.value)}
                className="bg-transparent text-xs text-slate-300 font-medium py-1 pr-2 outline-none cursor-pointer"
            >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
            </select>
        </div>
    );
};

export default LanguageSwitcher;
