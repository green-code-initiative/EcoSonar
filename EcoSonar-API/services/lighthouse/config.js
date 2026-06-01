import viewPortParams from '../../utils/viewportParams.js'

export default {
  extends: 'lighthouse:default',
  settings: {
    onlyCategories: ['performance', 'accessibility', 'best-practices'],
    formFactor: 'desktop',
    screenEmulation: {
      mobile: false,
      width: viewPortParams.width,
      height: viewPortParams.height,
      disabled: false
    },
    emulatedUserAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4695.0 Safari/537.36 Chrome-Lighthouse'
  },
  port: 36951,
  logLevel: 'error'
}
