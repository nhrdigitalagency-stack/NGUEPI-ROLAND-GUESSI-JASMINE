export interface CentralWeddingConfig {
  groomName: string;
  brideName: string;
  eventDate: string;
  eventStartTime: string | null;
  eventEndTime: string | null;
  timeZone: string;
  region: string;
  city: string;
  villageName: string;
  venueName: string;
  address: string;
  mapsUrl: string;
  directions: string;
  dressCode: string;
  parkingInfo: string;
  accommodationInfo: string;
  accessibilityInfo: string;
  couplePhotoUrl: string;
  parentsNames: string[];
  groomFamilyPhotoUrl: string;
  brideFamilyPhotoUrl: string;
  coupleWordFr: string;
  coupleWordEn: string;
  coupleStoryFr: string;
  coupleStoryEn: string;
  symbolicSharingNoteFr: string;
  symbolicSharingNoteEn: string;
  whatsappNumber: string;
  whatsappDisplayNumber: string;
  defaultLocale: 'fr' | 'en';
  supportedLocales: ('fr' | 'en')[];
  siteUrl: string;
  contributionsOpen: boolean;
  albumPrivate: boolean;
  retentionMonths: number;
}

export const defaultWeddingConfig: CentralWeddingConfig = {
  groomName: 'Nguepi Roland',
  brideName: 'Guessi Jasmine',
  eventDate: '2026-12-01',
  eventStartTime: null,
  eventEndTime: null,
  timeZone: 'Africa/Douala',
  region: 'Ouest',
  city: 'Bangangté',
  villageName: '',
  venueName: '',
  address: '',
  mapsUrl: '',
  directions: '',
  dressCode: '',
  parkingInfo: '',
  accommodationInfo: '',
  accessibilityInfo: '',
  couplePhotoUrl: '/assets/aistudio/a1f54cc2d911c8dabd7922cca2507e10_34dc280b.jpg',
  parentsNames: [],
  groomFamilyPhotoUrl: '',
  brideFamilyPhotoUrl: '',
  coupleWordFr: '',
  coupleWordEn: '',
  coupleStoryFr: '',
  coupleStoryEn: '',
  symbolicSharingNoteFr: '',
  symbolicSharingNoteEn: '',
  whatsappNumber: '33753049353',
  whatsappDisplayNumber: '+33 7 53 04 93 53',
  defaultLocale: 'fr',
  supportedLocales: ['fr', 'en'],
  siteUrl: '',
  contributionsOpen: true,
  albumPrivate: false,
  retentionMonths: 24,
};

export const officialGalleryShowcase = [
  {
    id: 'portrait-regard',
    src: '/assets/aistudio/a1f54cc2d911c8dabd7922cca2507e10_34dc280b.jpg',
    altFr: 'Nguepi Roland et Guessi Jasmine en tenue d’apparat indigo',
    altEn: 'Nguepi Roland and Guessi Jasmine in indigo ceremonial attire',
  },
  {
    id: 'couple-royal',
    src: '/assets/aistudio/fd42f998cc174303d779ba2f184e1775_39b39a14.jpg',
    altFr: 'Silhouette sculpturale et drapé traditionnel indigo',
    altEn: 'Sculptural silhouette and traditional indigo drape',
  },
  {
    id: 'couple-exterieur',
    src: '/assets/aistudio/267471665367741484_b9b446cc.jpg',
    altFr: 'Complicité et allure contemporaine inspirée du patrimoine',
    altEn: 'Complicity and contemporary heritage-inspired allure',
  },
  {
    id: 'marie-attributs',
    src: '/assets/aistudio/f0bc0dca8eae81fb94c2436bb59fc2ba_737570bd.jpg',
    altFr: 'Nguepi Roland en tenue traditionnelle indigo',
    altEn: 'Nguepi Roland in traditional indigo attire',
  },
  {
    id: 'decor-dot',
    src: '/assets/aistudio/Bridal_Bliss__Inside_Influencer_Gina_B____Yanis____cb4bf9f0.jpg',
    altFr: 'Scénographie traditionnelle parée d’étoffes Ndop et de corbeilles',
    altEn: 'Traditional ceremonial setting adorned with Ndop textiles and baskets',
  },
];
