import i18next from 'i18next';
import Backend from 'i18next-node-fs-backend';
import path from 'path';


i18next.use(Backend).init({
  lng: 'en',
  fallbackLng: 'en',
  defaultNS: 'translation',
  backend: {
    loadPath: path.join(__dirname, '/../../../translations/en_common.json'),
  },
});

export default i18next;



  


