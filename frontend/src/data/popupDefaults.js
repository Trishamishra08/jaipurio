// Storefront popup the admin can change (Appearance → Popup), saved as
// `settings.popup`. There are two versions: `web` is shown in a normal
// browser, `app` inside the Jaipurio mobile app (see utils/appContext.js).
// Anything not saved falls back to these defaults.

export const POPUP_IMAGE = 'https://minio-jaipurio.sakha.cloud/jaipurio/5-8.jpg';

// How often a visitor sees the popup.
export const POPUP_FREQUENCIES = [
  ['every', 'Every time the website is opened'],
  ['session', 'Once per browser tab (not again on refresh)'],
  ['day', 'Once a day'],
  ['once', 'Only once (until the offer changes)'],
];

export const POPUP_DEFAULTS = {
  delaySeconds: 2.5,
  frequency: 'every',
  web: {
    enabled: true,
    image: POPUP_IMAGE,
    // Website version: invite visitors to the app (store buttons appear once the links are added in the admin);
    // the email signup keeps it useful for people who stay on the website.
    eyebrow: 'Get the Jaipurio app',
    heading: 'Extra 10% off on the app',
    text: 'Download the Jaipurio app for an extra 10% off your first app order, app-only deals and live order updates.\nPrefer email? Subscribe below and get 10% off your first purchase.',
    couponCode: '',
    showEmailForm: true,
    submitText: 'Subscribe',
    successText: 'Thank you! You are subscribed — watch your inbox for your 10% off.',
    buttonText: '',
    buttonLink: '',
    showStoreButtons: true,
    playStoreUrl: '',
    appStoreUrl: '',
  },
  app: {
    enabled: true,
    image: POPUP_IMAGE,
    eyebrow: 'App exclusive',
    heading: 'Welcome to the Jaipurio app',
    text: 'Enjoy 10% off your first order in the app. Use the code below at checkout.',
    couponCode: '',
    showEmailForm: false,
    submitText: 'Subscribe',
    successText: 'Thank you! You are subscribed.',
    buttonText: 'Shop now',
    buttonLink: '/shop',
  },
};
