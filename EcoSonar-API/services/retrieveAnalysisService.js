import greenItRepository from '../dataBase/greenItRepository.js'
import lighthouseRepository from '../dataBase/lighthouseRepository.js'
import w3cRepository from '../dataBase/w3cRepository.js'
import urlsProjectRepository from '../dataBase/urlsProjectRepository.js'
import formatLighthouseAnalysis from './format/formatLighthouseAnalysis.js'
import SystemError from '../utils/SystemError.js'
import formatGreenItAnalysis from './format/formatGreenItAnalysis.js'
import formatW3cAnalysis from './format/formatW3cAnalysis.js'
import loggerService from '../loggers/traces.js'
import configurationService from './configurationService.js'

class RetrieveAnalysisService { }

/**
 * Get an analysis (GreenIt & Lighthouse & W3C) from a given project and URL
 * @param {string} projectName
 * @param {string} urlName
 * @returns {Object} Returns a formatted analysis
 */
RetrieveAnalysisService.prototype.getUrlAnalysis = async function (projectName, urlName) {
  let urlProject = []
  let systemError = false
  let greenitAnalysisDeployment = []
  let lighthouseResultDeployment = []
  let w3cAnalysisDeployment = []
  let w3cAnalysisLastAnalysis = null
  let lighthouseResultLastAnalysis = null
  let greenitAnalysisLastAnalysis = null

  await urlsProjectRepository.findUrl(projectName, urlName)
    .then((result) => { urlProject = result })
    .catch(() => { systemError = true })

  if (urlProject.length > 0) {
    await w3cRepository
      .findAnalysisUrl(urlProject[0].idKey)
      .then((result) => {
        if (result.length > 0) {
          const lastIndex = result.length - 1
          const lastAnalysis = [{
            idUrlW3c: result[lastIndex].idUrlW3c,
            dateW3cAnalysis: result[lastIndex].dateW3cAnalysis,
            score: result[lastIndex].score,
            w3cBestPractices: result[lastIndex].w3cBestPractices
          }]
          w3cAnalysisLastAnalysis = formatW3cAnalysis.w3cLastAnalysisFormatted(lastAnalysis)

          const deployments = result.map((deployment) => {
            return {
              idUrlW3c: deployment.idUrlW3c,
              dateW3cAnalysis: deployment.dateW3cAnalysis,
              score: deployment.score,
              w3cBestPractices: deployment.w3cBestPractices
            }
          })
          w3cAnalysisDeployment = formatW3cAnalysis.w3cAnalysisFormattedDeployments(deployments)
        }
      })
      .catch(() => {
        systemError = true
      })

    await greenItRepository
      .findAnalysisUrl(urlProject[0].idKey)
      .then((result) => {
        if (result.length > 0) {
          const lastIndex = result.length - 1
          const lastAnalysis = {
            domSize: result[lastIndex].domSize,
            nbRequest: result[lastIndex].nbRequest,
            responsesSize: result[lastIndex].responsesSize,
            ecoIndex: result[lastIndex].ecoIndex,
            grade: result[lastIndex].grade
          }
          greenitAnalysisLastAnalysis = formatGreenItAnalysis.greenItUrlAnalysisFormatted(lastAnalysis)
          const deployments = result.map((deployment) => {
            return {
              dateGreenAnalysis: deployment.dateGreenAnalysis,
              domSize: deployment.domSize,
              nbRequest: deployment.nbRequest,
              responsesSize: deployment.responsesSize,
              ecoIndex: deployment.ecoIndex
            }
          })
          greenitAnalysisDeployment = formatGreenItAnalysis.formatDeploymentsForGraphs(deployments)
        }
      })
      .catch(() => {
        systemError = true
      })

    await lighthouseRepository
      .findAnalysisUrl(urlProject[0].idKey)
      .then((result) => {
        if (result.length > 0) {
          const lastIndex = result.length - 1
          const lastAnalysis = {
            dateLighthouseAnalysis: result[lastIndex].dateLighthouseAnalysis,
            performance: result[lastIndex].performance,
            accessibility: result[lastIndex].accessibility,
            cumulativeLayoutShift: result[lastIndex].cumulativeLayoutShift,
            largestContentfulPaint: result[lastIndex].largestContentfulPaint,
            firstContentfulPaint: result[lastIndex].firstContentfulPaint,
            speedIndex: result[lastIndex].speedIndex,
            totalBlockingTime: result[lastIndex].totalBlockingTime,
            interactive: result[lastIndex].interactive
          }
          lighthouseResultLastAnalysis = formatLighthouseAnalysis.lighthouseUrlAnalysisFormatted(lastAnalysis)
          const deployments = result.map((deployment) => {
            return {
              dateAnalysis: deployment.dateLighthouseAnalysis,
              performanceScore: deployment.performance.score,
              accessibilityScore: deployment.accessibility.score,
              cumulativeLayoutShift: deployment.cumulativeLayoutShift.score,
              largestContentfulPaint: deployment.largestContentfulPaint.score,
              firstContentfulPaint: deployment.firstContentfulPaint.score,
              speedIndex: deployment.speedIndex.score,
              totalBlockingTime: deployment.totalBlockingTime.score,
              interactive: deployment.interactive.score
            }
          })
          lighthouseResultDeployment = formatLighthouseAnalysis.formatDeploymentsForGraphs(deployments)
        }
      })
      .catch(() => {
        systemError = true
      })
  }

  return new Promise((resolve, reject) => {
    if (systemError) {
      reject(new SystemError())
    } else {
      const analysis = {
        allowW3c: process.env.ECOSONAR_ENV_ALLOW_EXTERNAL_API || 'false',
        deployments: {
          greenit: greenitAnalysisDeployment,
          lighthouse: lighthouseResultDeployment,
          w3c: w3cAnalysisDeployment
        },
        lastAnalysis: {
          greenit: greenitAnalysisLastAnalysis,
          lighthouse: lighthouseResultLastAnalysis,
          w3c: w3cAnalysisLastAnalysis
        }
      }
      resolve(analysis)
    }
  })
}

/**
   * Get an analysis (GreenIt & Lighthouse) from a given project
   * @param {string} projectName
   * @returns {Object} Returns the formatted values with average score for the given project
   */

RetrieveAnalysisService.prototype.getProjectAnalysis = async function (projectName, res) {
  let urlsIdKey = []
  let systemError = false
  let greenitAnalysisDeployments = []
  let lighthouseAnalysisDeployments = []
  let w3cAnalysisDeployment = []
  let greenitLastAnalysis = null
  let lighthouseProjectLastAnalysis = null
  let w3cProjectLastAnalysis = null
  let allowW3cs = false;

  configurationService.getConfiguration(projectName, res)
    .then((config) => {
      loggerService.info(`GET CONFIGURATION - Project ${projectName} retrieved`)
      allowW3cs = config.w3c;
    })
    .catch((error) => {
      loggerService.error(error)
      loggerService.error(`GET CONFIGURATION - Get configuration for project ${projectName} encountered an error`)
    })

  await urlsProjectRepository.findAll(projectName)
    .then((result) => { urlsIdKey = result.map((el) => el.idKey) })
    .catch(() => { systemError = true })

  if (urlsIdKey.length > 0) {
    await greenItRepository
      .findAnalysisProject(urlsIdKey)
      .then((result) => {
        if (result.length > 0) {
          const dateLastAnalysis = result[result.length - 1].dateGreenAnalysis
          const lastAnalysis = result.filter((greenitAnalysis) => greenitAnalysis.dateGreenAnalysis.getTime() === dateLastAnalysis.getTime())
          greenitLastAnalysis = formatGreenItAnalysis.greenItProjectLastAnalysisFormatted(lastAnalysis)
          greenitAnalysisDeployments = formatGreenItAnalysis.formatDeploymentsForGraphs(result)
        }
      })
      .catch(() => {
        systemError = true
      })
    await lighthouseRepository
      .findAnalysisProject(urlsIdKey)
      .then((result) => {
        if (result.length > 0) {
          const dateLastAnalysis = result[result.length - 1].dateLighthouseAnalysis
          const lastAnalysis = result.filter(
            (deployment) =>
              deployment.dateLighthouseAnalysis.getTime() ===
              dateLastAnalysis.getTime()
          )
          lighthouseProjectLastAnalysis = formatLighthouseAnalysis.lighthouseProjectLastAnalysisFormatted(lastAnalysis)
          lighthouseAnalysisDeployments = formatLighthouseAnalysis.lighthouseAnalysisFormattedDeployments(result)
        }
      })
      .catch(() => {
        systemError = true
      })

    await w3cRepository.findAnalysisProject(urlsIdKey)
      .then((result) => {
        if (result.length > 0) {
          const dateLastAnalysis = result[result.length - 1].dateW3cAnalysis
          const lastAnalysis = result.filter(
            (deployment) =>
              deployment.dateW3cAnalysis.getTime() ===
              dateLastAnalysis.getTime()
          )
          w3cProjectLastAnalysis = formatW3cAnalysis.w3cLastAnalysisFormatted(lastAnalysis)
          w3cAnalysisDeployment = formatW3cAnalysis.w3cAnalysisFormattedDeployments(result)
        }
      })
      .catch(() => {
        systemError = true
      })
  }

  return new Promise((resolve, reject) => {
    if (systemError) {
      reject(new SystemError())
    } else {
      const analysis = {
        allowW3c: allowW3cs,
        deployments: {
          greenit: greenitAnalysisDeployments,
          lighthouse: lighthouseAnalysisDeployments,
          w3c: w3cAnalysisDeployment
        },
        lastAnalysis: {
          greenit: greenitLastAnalysis,
          lighthouse: lighthouseProjectLastAnalysis,
          w3c: w3cProjectLastAnalysis
        }
      }
      resolve(analysis)
    }
  })
}

function groupByProject (idKeys, fieldName, allAnalysis) {
  return allAnalysis.filter(obj => idKeys.includes(obj[fieldName]))
}

function regroupUrlIdKeyByProjectName (projects) {
  return projects.reduce((acc, obj) => {
    const existingObj = acc.find(o => o.projectName === obj.projectName)
    if (existingObj) {
      existingObj.IdKeys.push(obj.idKey)
    } else {
      acc.push({ projectName: obj.projectName, IdKeys: [obj.idKey] })
    }
    return acc
  }, [])
}

/**
   * Get the average of scores (EcoIndex & Performance & Accessibility) from all projects at a range of date
   * @param {string} filterName by default equal to null, if stirng is not null allow to filter project by their name
   * @returns {Array} Returns the formatted list of projects with analysis for each type of audit
   */
RetrieveAnalysisService.prototype.getAllProjectScoresAverage = async function (filterName = null) {
  const result = []
  let systemError = false
  try {
    const allLighthouseAnalysis = await lighthouseRepository.findAllAnalysis()
    const allgreenITAnalysis = await greenItRepository.findAllAnalysis()
    const allW3CAnalysis = await w3cRepository.findAllAnalysis()

    let projects = await urlsProjectRepository.findAllProjectsNames(filterName)
    projects = regroupUrlIdKeyByProjectName(projects)

    for (const project of projects) {
      const analysisOfProjectLighthouse = groupByProject(project.IdKeys, 'idUrlLighthouse', allLighthouseAnalysis)
      const analysisOfProjectGreenIt = groupByProject(project.IdKeys, 'idUrlGreen', allgreenITAnalysis)
      const analysisOfProjectW3C = groupByProject(project.IdKeys, 'idUrlW3c', allW3CAnalysis)
      result.push({
        name: project.projectName,
        lighthouse: analysisOfProjectLighthouse,
        greenIt: analysisOfProjectGreenIt,
        w3c: analysisOfProjectW3C
      })
    }
  } catch (err) {
    systemError = true
  }
  return new Promise((resolve, reject) => {
    if (systemError) {
      reject(new SystemError())
    } else {
      resolve(result)
    }
  })
}

/**
   * Get the EcoSonar scores (GreenIt & Lighthouse & W3C Validator) from a given project
   * @param {string} projectName
   * @returns {Object} Returns the formatted scores for the given project
   */
RetrieveAnalysisService.prototype.getProjectScores = async function (projectName) {
  let urlsIdKey = []
  let systemError = false
  let ecoIndex = null
  let accessScore = null
  let perfScore = null
  let w3cScore = null

  await urlsProjectRepository.findAll(projectName)
    .then((result) => { urlsIdKey = result.map((el) => el.idKey) })
    .catch(() => { systemError = true })

  if (urlsIdKey.length > 0) {
    await greenItRepository
      .findScoreProject(urlsIdKey)
      .then((res) => {
        if (res.length > 0) {
          const dateLastAnalysis = res[res.length - 1].dateGreenAnalysis
          const lastAnalysis = res.filter((greenitAnalysis) => greenitAnalysis.dateGreenAnalysis.getTime() === dateLastAnalysis.getTime())
          ecoIndex = 0
          for (const score of lastAnalysis) {
            ecoIndex += score.ecoIndex
          }
          ecoIndex = ecoIndex / lastAnalysis.length
        } else {
          loggerService.info('Greenit - no greenit analysis found for ' + projectName)
        }
      })
      .catch(() => {
        systemError = true
      })

    await lighthouseRepository
      .findScoreProject(urlsIdKey)
      .then((res) => {
        if (res.length > 0) {
          const dateLastAnalysis = res[res.length - 1].dateLighthouseAnalysis
          const lastAnalysis = res.filter(
            (deployment) =>
              deployment.dateLighthouseAnalysis.getTime() ===
            dateLastAnalysis.getTime()
          )
          accessScore = 0
          perfScore = 0
          for (const score of lastAnalysis) {
            accessScore += score.accessibility.score
            perfScore += score.performance.score
          }
          accessScore = accessScore / lastAnalysis.length
          perfScore = perfScore / lastAnalysis.length
        } else {
          loggerService.info('No lighthouse Analysis found for project ' + projectName)
        }
      })
      .catch(() => {
        systemError = true
      })

    await w3cRepository.findAnalysisProject(urlsIdKey)
      .then((res) => {
        if (res.length > 0) {
          const dateLastAnalysis = res[res.length - 1].dateW3cAnalysis
          const lastAnalysis = res.filter(
            (deployment) =>
              deployment.dateW3cAnalysis.getTime() ===
            dateLastAnalysis.getTime()
          )
          const w3cProjectLastAnalysis = formatW3cAnalysis.w3cLastAnalysisFormatted(lastAnalysis)
          w3cScore = w3cProjectLastAnalysis.score
        } else {
          loggerService.info('No W3C Analysis found for project ' + projectName)
        }
      })
      .catch(() => {
        systemError = true
      })
  }

  return new Promise((resolve, reject) => {
    if (systemError) {
      reject(new SystemError())
    } else {
      resolve({
        ecoIndex: ecoIndex !== null ? Math.round(ecoIndex) : null,
        perfScore: perfScore !== null ? Math.round(perfScore) : null,
        accessibilityScore: accessScore !== null ? Math.round(accessScore) : null,
        w3cScore: w3cScore !== null ? Math.round(w3cScore) : null
      })
    }
  })
}

const retrieveAnalysisService = new RetrieveAnalysisService()
export default retrieveAnalysisService
