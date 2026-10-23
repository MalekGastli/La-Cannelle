/**
 * Photographs on the site, all from Pexels (https://www.pexels.com/license/).
 * Photographer names follow the usernames shown on the Pexels photo pages and may differ in spelling
 * from the display names. Verify at https://www.pexels.com/photo/<id>/ if exact credits are needed.
 */
export type ImageCredit = { id: number; photographer: string; files: string[] };

export const IMAGE_CREDITS: ImageCredit[] = [
  { id: 34079357, photographer: 'The Visionary Vows', files: ['home_image.jpeg'] },
  { id: 11434576, photographer: 'Alina Tolle', files: ['exclusive-dining.jpg'] },
  { id: 16120244, photographer: 'Bertelli Fotografia', files: ['community-feast.jpg'] },
  { id: 32568165, photographer: 'Magda Ehlers', files: ['restaurant-interior.jpg'] },
  { id: 20013453, photographer: 'Jonathan Borba', files: ['exclusive-service.jpg'] },
  { id: 13871236, photographer: 'Bertelli Fotografia', files: ['services/office.jpg'] },
  { id: 16935999, photographer: 'Bertelli Fotografia', files: ['services/event.jpg'] },
  { id: 29040997, photographer: 'Jonathan Borba', files: ['services/weddings.jpg'] },
  { id: 38598141, photographer: 'Wolfart', files: ['services/corporate.jpg'] },
  { id: 38376794, photographer: 'Image Hunter', files: ['mediterranean-buffet.jpg'] },
  { id: 5638547, photographer: 'Shameel Mukkath', files: ['chocolate-sphere.jpg'] },
  { id: 31918529, photographer: 'Paolo Bici', files: ['fondant.jpg'] },
  { id: 3645126, photographer: 'Sebastian Coman Photography', files: ['scallops.jpg'] },
  { id: 31779538, photographer: 'Adriano Bragi', files: ['risotto.jpg'] },
  { id: 7741798, photographer: 'Emre Vonal', files: ['lamb.jpg'] },
  { id: 20095444, photographer: 'Nadin Sh', files: ['beef-wellington.jpg'] },
  { id: 29138860, photographer: 'Nano Erdozain', files: ['salad.jpg'] },
  { id: 31372390, photographer: 'Jose Antonio Otegui Auzmendi', files: ['truffle-arancini.jpg'] },
  { id: 15671277, photographer: 'Luis Becerra Fotografo', files: ['chef-passion.jpg'] },
  { id: 37827340, photographer: 'Nude The Photographer', files: ['accessories/table-setting.jpg'] },
];
