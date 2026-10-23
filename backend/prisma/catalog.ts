// Product catalogue imported from the owner's Drive folder (names from the photo file names).
// Prices are placeholders to be reviewed in the admin area. Items without a photo yet are created unavailable.
export type CatalogItem = { name: string; description: string; category: 'FINGERFOOD'|'STARTER'|'SOUP'|'MAIN'|'SIDE'|'DESSERT'|'BEVERAGE'; price: number; cost: number; image: string; available: boolean };
export const CATALOG: CatalogItem[] = [
  {
    "name": "Italienisches Gebäck",
    "description": "Feines italienisches Gebäck, frisch angerichtet.",
    "category": "DESSERT",
    "price": 3.2,
    "cost": 1.28,
    "image": "/images/products/italienisches-gebaeck.jpg",
    "available": true
  },
  {
    "name": "Teegebäck",
    "description": "Knuspriges Teegebäck zu Kaffee und Tee.",
    "category": "DESSERT",
    "price": 2.4,
    "cost": 0.96,
    "image": "/images/products/teegebaeck.jpg",
    "available": true
  },
  {
    "name": "Weihnachtsgebäck",
    "description": "Saisonales Weihnachtsgebäck.",
    "category": "DESSERT",
    "price": 2.6,
    "cost": 1.04,
    "image": "/images/products/weihnachtsgebaeck.jpg",
    "available": true
  },
  {
    "name": "Apfelschnitte",
    "description": "Saftiger Apfelkuchen vom Blech.",
    "category": "DESSERT",
    "price": 3.2,
    "cost": 1.28,
    "image": "/images/products/apfelschnitte.jpg",
    "available": true
  },
  {
    "name": "Pflaumenstreusel",
    "description": "Pflaumenkuchen mit Butterstreuseln.",
    "category": "DESSERT",
    "price": 3.2,
    "cost": 1.28,
    "image": "/images/products/pflaumenstreusel.jpg",
    "available": true
  },
  {
    "name": "Donauwelle",
    "description": "Klassiker mit Kirschen, Vanillecreme und Schokolade.",
    "category": "DESSERT",
    "price": 3.4,
    "cost": 1.36,
    "image": "/images/products/donauwelle.jpg",
    "available": true
  },
  {
    "name": "Schoko-Kirsch-Kuchen",
    "description": "Saftiger Schokoladenkuchen mit Kirschen.",
    "category": "DESSERT",
    "price": 3.4,
    "cost": 1.36,
    "image": "/images/products/schoko-kirsch-kuchen.jpg",
    "available": true
  },
  {
    "name": "Zupfkuchen",
    "description": "Schokoladenteig mit Quarkfüllung.",
    "category": "DESSERT",
    "price": 3.4,
    "cost": 1.36,
    "image": "/images/mediterranean-buffet.jpg",
    "available": false
  },
  {
    "name": "Käsekuchen",
    "description": "Klassischer Käsekuchen.",
    "category": "DESSERT",
    "price": 3.4,
    "cost": 1.36,
    "image": "/images/mediterranean-buffet.jpg",
    "available": false
  },
  {
    "name": "Brownie",
    "description": "Saftiger Schokoladen-Brownie.",
    "category": "DESSERT",
    "price": 2.9,
    "cost": 1.16,
    "image": "/images/mediterranean-buffet.jpg",
    "available": false
  },
  {
    "name": "Grissini",
    "description": "Knusprige Grissini-Stangen als Knabberei.",
    "category": "FINGERFOOD",
    "price": 1.2,
    "cost": 0.48,
    "image": "/images/products/grissini.jpg",
    "available": true
  },
  {
    "name": "Pecannusskerne",
    "description": "Geröstete Pecannusskerne.",
    "category": "FINGERFOOD",
    "price": 1.6,
    "cost": 0.64,
    "image": "/images/products/pecannusskerne.jpg",
    "available": true
  },
  {
    "name": "Walnüsse",
    "description": "Knackige Walnusskerne.",
    "category": "FINGERFOOD",
    "price": 1.5,
    "cost": 0.6,
    "image": "/images/products/walnuesse.jpg",
    "available": true
  },
  {
    "name": "Gemüsechips",
    "description": "Bunte, knusprige Gemüsechips.",
    "category": "FINGERFOOD",
    "price": 1.4,
    "cost": 0.56,
    "image": "/images/products/gemuesechips.jpg",
    "available": true
  },
  {
    "name": "Obstgläser",
    "description": "Frisches Obst im Glas.",
    "category": "DESSERT",
    "price": 3.6,
    "cost": 1.44,
    "image": "/images/mediterranean-buffet.jpg",
    "available": false
  },
  {
    "name": "Rindergulasch mit Spätzle",
    "description": "Zartes Rindergulasch mit hausgemachten Spätzle.",
    "category": "MAIN",
    "price": 11.9,
    "cost": 4.76,
    "image": "/images/products/rindergulasch-spaetzle.jpg",
    "available": true
  },
  {
    "name": "Thai Curry",
    "description": "Aromatisches Thai-Curry mit Gemüse und Reis.",
    "category": "MAIN",
    "price": 10.9,
    "cost": 4.36,
    "image": "/images/mediterranean-buffet.jpg",
    "available": false
  },
  {
    "name": "Tandoori-Bowl",
    "description": "Tandoori-Hähnchen mit Reis und Gemüse in der Bowl.",
    "category": "MAIN",
    "price": 11.5,
    "cost": 4.6,
    "image": "/images/mediterranean-buffet.jpg",
    "available": false
  },
  {
    "name": "Hähnchenschnitzel mit Bratkartoffeln",
    "description": "Knuspriges Hähnchenschnitzel mit Bratkartoffeln.",
    "category": "MAIN",
    "price": 10.9,
    "cost": 4.36,
    "image": "/images/products/haehnchenschnitzel-bratkartoffeln.jpg",
    "available": true
  },
  {
    "name": "Falafel-Bowl",
    "description": "Falafel mit Hummus, Salat und Dip. Vegetarisch.",
    "category": "MAIN",
    "price": 9.9,
    "cost": 3.96,
    "image": "/images/products/falafel-bowl.jpg",
    "available": true
  },
  {
    "name": "Osaka Wok mit Rind & Udon",
    "description": "Gebratene Udon-Nudeln mit Rindfleisch und Gemüse.",
    "category": "MAIN",
    "price": 12.5,
    "cost": 5.0,
    "image": "/images/mediterranean-buffet.jpg",
    "available": false
  },
  {
    "name": "Chicken Alfredo",
    "description": "Pasta mit Hähnchen in cremiger Alfredo-Sauce.",
    "category": "MAIN",
    "price": 10.9,
    "cost": 4.36,
    "image": "/images/products/chicken-alfredo.jpg",
    "available": true
  },
  {
    "name": "Rindslasagne",
    "description": "Lasagne mit Rinderhack, Tomatensauce und Bechamel.",
    "category": "MAIN",
    "price": 10.9,
    "cost": 4.36,
    "image": "/images/products/rind-lasagne.jpg",
    "available": true
  },
  {
    "name": "Penne mit Lachs und Spinat",
    "description": "Penne in Sahnesauce mit Lachs und frischem Spinat.",
    "category": "MAIN",
    "price": 11.5,
    "cost": 4.6,
    "image": "/images/products/penne-lachs-spinat.jpg",
    "available": true
  },
  {
    "name": "Linsencurry mit Reis",
    "description": "Würziges Linsencurry mit Basmatireis. Vegan.",
    "category": "MAIN",
    "price": 9.5,
    "cost": 3.8,
    "image": "/images/products/linsencurry-reis.jpg",
    "available": true
  },
  {
    "name": "Penne Arrabbiata",
    "description": "Penne in scharfer Tomatensauce. Vegan.",
    "category": "MAIN",
    "price": 8.9,
    "cost": 3.56,
    "image": "/images/products/penne-arrabbiata.jpg",
    "available": true
  },
  {
    "name": "Marrakech-Bowl mit Garnelen",
    "description": "Orientalische Bowl mit Garnelen, Couscous und Gemüse.",
    "category": "MAIN",
    "price": 13.5,
    "cost": 5.4,
    "image": "/images/mediterranean-buffet.jpg",
    "available": false
  },
  {
    "name": "Rinderbäckchen mit Salbeistampf",
    "description": "Geschmorte Rinderbäckchen mit Salbei-Kartoffelstampf.",
    "category": "MAIN",
    "price": 14.5,
    "cost": 5.8,
    "image": "/images/products/rinderbaeckchen-salbei-stampf.jpg",
    "available": true
  },
  {
    "name": "Hawaii Poke Bowl mit Thunfisch",
    "description": "Poke Bowl mit Thunfisch, Reis, Avocado und Edamame.",
    "category": "MAIN",
    "price": 13.5,
    "cost": 5.4,
    "image": "/images/mediterranean-buffet.jpg",
    "available": false
  },
  {
    "name": "Tikka Masala mit Hähnchen",
    "description": "Hähnchen in cremiger Tikka-Masala-Sauce.",
    "category": "MAIN",
    "price": 11.5,
    "cost": 4.6,
    "image": "/images/mediterranean-buffet.jpg",
    "available": false
  },
  {
    "name": "Rinderroulade mit Spätzle",
    "description": "Klassische Rinderroulade mit Spätzle und Rotkohl.",
    "category": "MAIN",
    "price": 13.9,
    "cost": 5.56,
    "image": "/images/products/rinderroulade-spaetzle.jpg",
    "available": true
  },
  {
    "name": "Lachsfilet-Gratin mit Rosenkohl",
    "description": "Überbackenes Lachsfilet mit Rosenkohl.",
    "category": "MAIN",
    "price": 13.9,
    "cost": 5.56,
    "image": "/images/products/lachsfilet-gratin-rosenkohl.jpg",
    "available": true
  },
  {
    "name": "Putengeschnetzeltes mit Wildreis",
    "description": "Putengeschnetzeltes in Rahmsauce mit Wildreis.",
    "category": "MAIN",
    "price": 10.9,
    "cost": 4.36,
    "image": "/images/products/putengeschnetzeltes-wildreis.jpg",
    "available": true
  },
  {
    "name": "Butter Chicken mit Reis",
    "description": "Hähnchen in milder Buttersauce mit Basmatireis.",
    "category": "MAIN",
    "price": 11.5,
    "cost": 4.6,
    "image": "/images/products/butter-chicken-reis.jpg",
    "available": true
  },
  {
    "name": "Geschmorter Rinderbraten mit Rosmarinkartoffeln",
    "description": "Langsam geschmorter Rinderbraten mit Rosmarinkartoffeln.",
    "category": "MAIN",
    "price": 14.5,
    "cost": 5.8,
    "image": "/images/mediterranean-buffet.jpg",
    "available": false
  },
  {
    "name": "Kürbissuppe",
    "description": "Cremige Kürbissuppe mit Kürbiskernöl.",
    "category": "SOUP",
    "price": 3.9,
    "cost": 1.56,
    "image": "/images/products/kuerbissuppe.jpg",
    "available": true
  },
  {
    "name": "Tomatencremesuppe",
    "description": "Samtige Tomatencremesuppe.",
    "category": "SOUP",
    "price": 3.6,
    "cost": 1.44,
    "image": "/images/products/tomatencremesuppe.jpg",
    "available": true
  },
  {
    "name": "Spargelsuppe",
    "description": "Feine Spargelcremesuppe.",
    "category": "SOUP",
    "price": 4.2,
    "cost": 1.68,
    "image": "/images/products/spargelsuppe.jpg",
    "available": true
  },
  {
    "name": "Zitronengras-Kokos-Suppe",
    "description": "Thai-inspirierte Suppe mit Kokosmilch und Zitronengras.",
    "category": "SOUP",
    "price": 4.2,
    "cost": 1.68,
    "image": "/images/products/zitronengras-kokos-suppe.jpg",
    "available": true
  },
  {
    "name": "Minestrone",
    "description": "Italienische Gemüsesuppe.",
    "category": "SOUP",
    "price": 3.8,
    "cost": 1.52,
    "image": "/images/products/minestrone.jpg",
    "available": true
  },
  {
    "name": "Blumenkohlsuppe",
    "description": "Cremige Blumenkohlsuppe.",
    "category": "SOUP",
    "price": 3.8,
    "cost": 1.52,
    "image": "/images/products/blumenkohlsuppe.jpg",
    "available": true
  },
  {
    "name": "Hühner-Kraftbrühe",
    "description": "Klare Hühnerbrühe mit Einlage.",
    "category": "SOUP",
    "price": 3.6,
    "cost": 1.44,
    "image": "/images/products/huehner-kraftbruehe.jpg",
    "available": true
  },
  {
    "name": "Rinderkraftbrühe",
    "description": "Kräftige Rinderbrühe.",
    "category": "SOUP",
    "price": 3.8,
    "cost": 1.52,
    "image": "/images/products/rinderkraftbruehe.jpg",
    "available": true
  },
  {
    "name": "Gemüsebrühe",
    "description": "Klare Gemüsebrühe. Vegan.",
    "category": "SOUP",
    "price": 3.4,
    "cost": 1.36,
    "image": "/images/products/gemuesebruehe.jpg",
    "available": true
  },
  {
    "name": "Gulaschsuppe",
    "description": "Herzhafte Gulaschsuppe mit Rindfleisch.",
    "category": "SOUP",
    "price": 4.4,
    "cost": 1.76,
    "image": "/images/products/gulaschsuppe.jpg",
    "available": true
  },
  {
    "name": "Türkische Linsensuppe",
    "description": "Rote Linsensuppe nach türkischer Art.",
    "category": "SOUP",
    "price": 3.6,
    "cost": 1.44,
    "image": "/images/products/tuerkische-linsensuppe.jpg",
    "available": true
  },
  {
    "name": "Ramensuppe",
    "description": "Japanische Nudelsuppe mit Ei und Gemüse.",
    "category": "SOUP",
    "price": 4.8,
    "cost": 1.92,
    "image": "/images/products/ramensuppe.jpg",
    "available": true
  },
  {
    "name": "Französische Zwiebelsuppe",
    "description": "Zwiebelsuppe mit überbackenem Käsebaguette.",
    "category": "SOUP",
    "price": 4.2,
    "cost": 1.68,
    "image": "/images/products/franzoesische-zwiebelsuppe.jpg",
    "available": true
  },
  {
    "name": "Harira (marokkanische Suppe)",
    "description": "Marokkanische Suppe mit Linsen, Kichererbsen und Tomaten.",
    "category": "SOUP",
    "price": 4.2,
    "cost": 1.68,
    "image": "/images/products/harira.jpg",
    "available": true
  },
  {
    "name": "Rote-Bete-Suppe",
    "description": "Samtige Rote-Bete-Suppe.",
    "category": "SOUP",
    "price": 3.9,
    "cost": 1.56,
    "image": "/images/products/rote-bete-suppe.jpg",
    "available": true
  },
  {
    "name": "Hummerbisque",
    "description": "Feine Bisque vom Hummer.",
    "category": "SOUP",
    "price": 6.9,
    "cost": 2.76,
    "image": "/images/products/hummerbisque.jpg",
    "available": true
  },
  {
    "name": "Trüffelsuppe",
    "description": "Cremige Suppe mit Trüffel.",
    "category": "SOUP",
    "price": 6.5,
    "cost": 2.6,
    "image": "/images/products/trueffelsuppe.jpg",
    "available": true
  },
  {
    "name": "Penne-Pesto-Salat",
    "description": "Nudelsalat mit Pesto und Tomaten.",
    "category": "STARTER",
    "price": 3.9,
    "cost": 1.56,
    "image": "/images/products/penne-pesto-salat.jpg",
    "available": true
  },
  {
    "name": "Caesar Salad",
    "description": "Römersalat mit Parmesan, Croutons und Caesar-Dressing.",
    "category": "STARTER",
    "price": 4.4,
    "cost": 1.76,
    "image": "/images/products/caesar-salad.jpg",
    "available": true
  },
  {
    "name": "Bauernsalat",
    "description": "Gemischter Salat mit Feta, Oliven und Gemüse.",
    "category": "STARTER",
    "price": 3.6,
    "cost": 1.44,
    "image": "/images/products/bauernsalat.jpg",
    "available": true
  },
  {
    "name": "Couscoussalat",
    "description": "Orientalischer Couscoussalat. Vegan.",
    "category": "STARTER",
    "price": 3.8,
    "cost": 1.52,
    "image": "/images/products/couscoussalat.jpg",
    "available": true
  },
  {
    "name": "Feldsalat mit Orangen",
    "description": "Feldsalat mit Orangenfilets und Nüssen.",
    "category": "STARTER",
    "price": 4.2,
    "cost": 1.68,
    "image": "/images/products/feldsalat-orangen.jpg",
    "available": true
  },
  {
    "name": "Bulgursalat",
    "description": "Bulgursalat mit Tomaten, Petersilie und Minze.",
    "category": "STARTER",
    "price": 3.8,
    "cost": 1.52,
    "image": "/images/products/bulgursalat.jpg",
    "available": true
  },
  {
    "name": "Rucola-Parmesan-Salat",
    "description": "Rucola mit Parmesanspänen und Balsamico.",
    "category": "STARTER",
    "price": 4.2,
    "cost": 1.68,
    "image": "/images/products/rucola-parmesan-salat.jpg",
    "available": true
  },
  {
    "name": "Römersalat",
    "description": "Knackiger Römersalat mit Dressing.",
    "category": "STARTER",
    "price": 3.5,
    "cost": 1.4,
    "image": "/images/products/roemersalat.jpg",
    "available": true
  },
  {
    "name": "Quinoa-Salat",
    "description": "Quinoa-Salat mit Gemüse. Vegan.",
    "category": "STARTER",
    "price": 4.2,
    "cost": 1.68,
    "image": "/images/products/quinoa-salat.jpg",
    "available": true
  },
  {
    "name": "Mango-Salat",
    "description": "Fruchtiger Salat mit Mango.",
    "category": "STARTER",
    "price": 4.2,
    "cost": 1.68,
    "image": "/images/products/mango-salat.jpg",
    "available": true
  },
  {
    "name": "Kimchi-Hähnchen-Salat",
    "description": "Pochiertes Hähnchen mit Kimchi auf Kohlblättern.",
    "category": "STARTER",
    "price": 4.6,
    "cost": 1.84,
    "image": "/images/products/kimchi-salat.jpg",
    "available": true
  },
  {
    "name": "Taboulleh",
    "description": "Libanesischer Petersilien-Bulgur-Salat. Vegan.",
    "category": "STARTER",
    "price": 3.8,
    "cost": 1.52,
    "image": "/images/products/taboulleh.jpg",
    "available": true
  },
  {
    "name": "Fattoush-Salat",
    "description": "Orientalischer Brotsalat mit Gemüse.",
    "category": "STARTER",
    "price": 4.0,
    "cost": 1.6,
    "image": "/images/products/fattoush-salat.jpg",
    "available": true
  },
  {
    "name": "Avocado-Salat",
    "description": "Frischer Salat mit Avocado.",
    "category": "STARTER",
    "price": 4.4,
    "cost": 1.76,
    "image": "/images/products/avocado-salat.jpg",
    "available": true
  },
  {
    "name": "Marokkanischer Rote-Bete-Salat",
    "description": "Rote-Bete-Salat nach marokkanischer Art.",
    "category": "STARTER",
    "price": 3.9,
    "cost": 1.56,
    "image": "/images/products/marokkanischer-rote-bete-salat.jpg",
    "available": true
  },
  {
    "name": "Gurkensalat mit Dill",
    "description": "Erfrischender Gurkensalat mit Dill.",
    "category": "STARTER",
    "price": 3.4,
    "cost": 1.36,
    "image": "/images/products/gurkensalat-dill.jpg",
    "available": true
  },
  {
    "name": "Wassermelonen-Feta-Salat",
    "description": "Wassermelone mit Feta und Minze.",
    "category": "STARTER",
    "price": 4.4,
    "cost": 1.76,
    "image": "/images/products/wassermelonen-feta-salat.jpg",
    "available": true
  },
  {
    "name": "Limonencreme",
    "description": "Erfrischende Limonencreme.",
    "category": "DESSERT",
    "price": 3.9,
    "cost": 1.56,
    "image": "/images/products/limonencreme.jpg",
    "available": true
  },
  {
    "name": "Himbeer-Trifle",
    "description": "Trifle mit Himbeeren und Vanillecreme im Glas.",
    "category": "DESSERT",
    "price": 4.2,
    "cost": 1.68,
    "image": "/images/products/himbeer-trifle.jpg",
    "available": true
  },
  {
    "name": "Parfait",
    "description": "Feines gefrorenes Parfait.",
    "category": "DESSERT",
    "price": 4.2,
    "cost": 1.68,
    "image": "/images/mediterranean-buffet.jpg",
    "available": false
  },
  {
    "name": "Crème brûlée",
    "description": "Vanillecreme mit karamellisierter Zuckerkruste.",
    "category": "DESSERT",
    "price": 4.4,
    "cost": 1.76,
    "image": "/images/products/creme-brulee.jpg",
    "available": true
  },
  {
    "name": "Obstplatte",
    "description": "Saisonale Obstplatte.",
    "category": "DESSERT",
    "price": 3.9,
    "cost": 1.56,
    "image": "/images/mediterranean-buffet.jpg",
    "available": false
  },
  {
    "name": "Nizza-Salat",
    "description": "Salat mit Thunfisch, Ei, Oliven und Bohnen.",
    "category": "STARTER",
    "price": 4.6,
    "cost": 1.84,
    "image": "/images/mediterranean-buffet.jpg",
    "available": false
  },
  {
    "name": "Carpaccio vom Rind",
    "description": "Dünn geschnittenes Rinderfilet mit Parmesan und Rucola.",
    "category": "STARTER",
    "price": 7.9,
    "cost": 3.16,
    "image": "/images/mediterranean-buffet.jpg",
    "available": false
  },
  {
    "name": "Ceviche",
    "description": "Marinierter Fisch mit Limette und Koriander.",
    "category": "STARTER",
    "price": 7.5,
    "cost": 3.0,
    "image": "/images/mediterranean-buffet.jpg",
    "available": false
  },
  {
    "name": "Geflügelsalat",
    "description": "Salat mit Geflügelstreifen.",
    "category": "STARTER",
    "price": 4.6,
    "cost": 1.84,
    "image": "/images/products/gefluegelsalat.jpg",
    "available": true
  },
  {
    "name": "Gebeizte Entenbrust",
    "description": "Dünn aufgeschnittene gebeizte Entenbrust.",
    "category": "STARTER",
    "price": 8.5,
    "cost": 3.4,
    "image": "/images/products/gebeizte-entenbrust.jpg",
    "available": true
  },
  {
    "name": "Antipasti",
    "description": "Italienische Antipasti-Auswahl.",
    "category": "STARTER",
    "price": 5.9,
    "cost": 2.36,
    "image": "/images/mediterranean-buffet.jpg",
    "available": false
  },
  {
    "name": "Bruschetta",
    "description": "Geröstetes Brot mit Tomaten und Basilikum.",
    "category": "STARTER",
    "price": 3.4,
    "cost": 1.36,
    "image": "/images/mediterranean-buffet.jpg",
    "available": false
  },
  {
    "name": "Rote-Bete-Carpaccio",
    "description": "Rote-Bete-Carpaccio mit Frischkäse.",
    "category": "STARTER",
    "price": 4.6,
    "cost": 1.84,
    "image": "/images/products/beet-carpaccio.jpg",
    "available": true
  },
  {
    "name": "Gemüse-Tempura",
    "description": "Knusprig frittiertes Gemüse im Tempurateig.",
    "category": "STARTER",
    "price": 4.2,
    "cost": 1.68,
    "image": "/images/products/gemuese-tempura.jpg",
    "available": true
  },
  {
    "name": "Hummersalat",
    "description": "Salat mit Hummerfleisch.",
    "category": "STARTER",
    "price": 9.5,
    "cost": 3.8,
    "image": "/images/products/hummersalat.jpg",
    "available": true
  },
  {
    "name": "Austern",
    "description": "Frische Austern.",
    "category": "STARTER",
    "price": 9.9,
    "cost": 3.96,
    "image": "/images/mediterranean-buffet.jpg",
    "available": false
  }
];
