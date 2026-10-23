import { commonTranslations } from './common';
import { connectTranslations } from './connect';
import { homeTranslations } from './home';
import { orderTranslations } from './order';
import { servicesTranslations } from './services';
import { menusTranslations } from './menus';
import { contactTranslations } from './contact';
import { aboutTranslations } from './about';
import { adminTranslations } from './admin';

export const translations = {
  common: commonTranslations,
  connect: connectTranslations,
  home: homeTranslations,
  order: orderTranslations,
  services: servicesTranslations,
  menus: menusTranslations,
  contact: contactTranslations,
  about: aboutTranslations,
  admin: adminTranslations,
};

export type TranslationModule = keyof typeof translations;
