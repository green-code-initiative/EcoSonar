import lighthouse from 'lighthouse'
import puppeteer from 'puppeteer'
import config from './config.js'
import authenticationService from '../authenticationService.js'
import userJourneyService from '../userJourneyService.js'
import viewPortParams from '../../utils/viewportParams.js'
import loggerService from '../../loggers/traces.js'

export default async function lighthouseAnalysis (urlList, projectName, username, password) {
  const browserArgs = [
    '--no-sandbox',
    '--disable-dev-shm-usage', // can't run inside docker without
    '--disable-setuid-sandbox',
    '--ignore-certificate-errors',
    '--window-size=1920,1080',
    '--start-maximized',
    '--remote-debugging-port=36951'
  ]

  const proxyConfiguration = await authenticationService.useProxyIfNeeded(projectName)
  if (proxyConfiguration) {
    browserArgs.push(proxyConfiguration)
  }

  const browserLight = await puppeteer.launch({
    headless: true,
    args: browserArgs,
    timeout: 0,
    ignoreHTTPSErrors: true,
    // Keep gpu horsepower in headless
    ignoreDefaultArgs: [
      '--disable-gpu',
      '--enable-automation'
    ],
    defaultViewport: viewPortParams
  })

  const results = []

  const generateReportForHome = async (url, index) => {
    //Launch lighthouse analysis
    const homePageReport = await lighthouse(url, { port: 36951, ...config })
    const homePageReportLhr = homePageReport.lhr;
    results[index] = { ...homePageReportLhr, url }
    loggerService.info(`home page performance report generated successfully`);
  };

  try {
    let lighthouseResults
    let authenticatedPage
    let userJourney
    const loginSucceeded = await authenticationService.loginIfNeeded(browserLight, projectName, username, password)
    if (loginSucceeded) {
      for (const [index, url] of urlList.entries()) {
        const page = await browserLight.newPage() // prevent browser to close before ending all pages analysis
        try {
          loggerService.info('Lighthouse Analysis launched for url ' + url)
          await userJourneyService.getUserFlow(projectName, url)
            .then((result) => {
              userJourney = result
            }).catch((error) => {
              loggerService.info(error.message)
            })
          if (userJourney) {
            authenticatedPage = await userJourneyService.playUserFlowLighthouse(url, browserLight, userJourney)
          } 
          //If the url requires an authentication
          if (authenticatedPage) {
            const targetUrl = authenticatedPage ? authenticatedPage.url() : url
			console.log('Light house analysis in progress for the url ' + targetUrl)
			await generateReportForHome(targetUrl, index)
          } else {
            lighthouseResults = await lighthouse(url, { disableStorageReset: true }, config, page)
            loggerService.info('Light house analysis without authentication in progress for the url '+ url);
            results[index] = { ...lighthouseResults.lhr, url }
          }

        } catch (error) {
          loggerService.error('LIGHTHOUSE ANALYSIS - An error occured when auditing ' + url)
          loggerService.error('\x1b[31m%s\x1b[0m', error)
        }
      }
    } else {
      loggerService.warn('Could not log in, audit for lighthouse analysis is skipped')
    }
  } catch (error) {
    loggerService.error('\x1b[31m%s\x1b[0m', error)
  } finally {
    loggerService.info('Closing browser for Lighthouse');
    await browserLight.close();
  }
  return results;
}
