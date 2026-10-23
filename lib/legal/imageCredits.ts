/**
 * Photographs on the site, all from Pexels (https://www.pexels.com/license/).
 * Photographer names follow the usernames shown on the Pexels photo pages and may differ in spelling
 * from the display names. Verify at https://www.pexels.com/photo/<id>/ if exact credits are needed.
 */
export type ImageCredit = { id: number; photographer: string; files: string[] };

export const IMAGE_CREDITS: ImageCredit[] = [
  { id: 36766850, photographer: 'Kevin Yung', files: ['home_image.jpeg'] },
  { id: 34279947, photographer: 'Tahir Xəlfəquliyev', files: ['exclusive-dining.jpg'] },
  { id: 38432205, photographer: 'Artyom Rafaelovich Adamyan', files: ['community-feast.jpg'] },
  { id: 28976229, photographer: 'Angel Ayala', files: ['restaurant-interior.jpg'] },
  { id: 34293333, photographer: 'Sergei Starostin', files: ['exclusive-service.jpg'] },
  { id: 39401644, photographer: 'İrem Yılmaztürk', files: ['services/office.jpg'] },
  { id: 27025523, photographer: 'Photography Maghradze PH', files: ['services/event.jpg'] },
  { id: 37097169, photographer: 'Mohd Hasan', files: ['services/weddings.jpg'] },
  { id: 37516560, photographer: 'Tahir Xəlfəquliyev', files: ['services/corporate.jpg'] },
  { id: 39303846, photographer: 'Thato Moiketsi', files: ['mediterranean-buffet.jpg'] },
  { id: 5638547, photographer: 'Shameel Mukkath', files: ['chocolate-sphere.jpg'] },
  { id: 31918529, photographer: 'Paolo Bici', files: ['fondant.jpg'] },
  { id: 34279952, photographer: 'Tahir Xəlfəquliyev', files: ['scallops.jpg'] },
  { id: 31779538, photographer: 'Adriano Bragi', files: ['risotto.jpg'] },
  { id: 32611697, photographer: 'Nguyen Ngoc Tien', files: ['buffet-fingerfood.jpg'] },
  { id: 7741798, photographer: 'Emre Vonal', files: ['lamb.jpg'] },
  { id: 20095444, photographer: 'Nadin Sh', files: ['beef-wellington.jpg'] },
  { id: 5157389, photographer: 'Rene Terp', files: ['salad.jpg'] },
  { id: 8252831, photographer: 'Julia Filirovska', files: ['truffle-arancini.jpg'] },
  { id: 15671277, photographer: 'Luis Becerra Fotografo', files: ['chef-passion.jpg'] },
  { id: 37827340, photographer: 'Nude The Photographer', files: ['accessories/table-setting.jpg'] },
];
