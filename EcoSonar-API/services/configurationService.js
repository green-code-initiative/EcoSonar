import configurationRepository from '../dataBase/configurationRepository.js'
import urlsProjectRepository from '../dataBase/urlsProjectRepository.js'
import SystemError from '../utils/SystemError.js'
import loggerService from '../loggers/traces.js'

class ConfigurationService {}

// Shared helper: get project idKey, auto-creating the project if it doesn't exist
async function getOrCreateProject(projectName) {
  let result = await urlsProjectRepository.getUrlProject(projectName)

  if (result == null) {
    loggerService.info(`PROJECT - No project named ${projectName} found, creating it`)
    result = await urlsProjectRepository.createProject(projectName)
  }

  return result.idKey
}

ConfigurationService.prototype.saveConfiguration = async function (projectName, w3cBool, carbonBool) {
  let idKey = null
  let configExist = false

  try {
    idKey = await getOrCreateProject(projectName)
  } catch {
    throw new SystemError()
  }

  loggerService.info(`GET CONFIGURATION - Checking if project ${projectName} already has a config`)
  const existing = await configurationRepository.findConfiguration(idKey)
  if (existing != null) {
    configExist = true
    loggerService.info(`GET CONFIGURATION - Project ${projectName} config present`)
  }

  if (!configExist) {
    loggerService.info(`GET CONFIGURATION - Creating a config for the project ${projectName}`)
    return configurationRepository.insertConfiguration(idKey, w3cBool, carbonBool)
  } else {
    const existingConfig = await configurationRepository.findConfiguration(idKey)
    return { Configuration: existingConfig ?? '' }
  }
}

ConfigurationService.prototype.updateConfiguration = async function (projectName, w3cBool, carbonBool) {
  let idKey = null

  try {
    idKey = await getOrCreateProject(projectName)
  } catch {
    throw new SystemError()
  }

  return configurationRepository.updateConfiguration(idKey, w3cBool, carbonBool)
}

ConfigurationService.prototype.getConfiguration = async function (projectName) {
  let idKey = null

  try {
    idKey = await getOrCreateProject(projectName)
  } catch {
    throw new SystemError()
  }

  const existingConfig = await configurationRepository.findConfiguration(idKey)
  return { Configuration: existingConfig ?? '' }
}

ConfigurationService.prototype.getW3CConfig = async function (projectName) {
  let idKey = null

  try {
    idKey = await getOrCreateProject(projectName)
  } catch {
    throw new SystemError()
  }

  const existingConfig = await configurationRepository.findConfiguration(idKey)
  return { Configuration: existingConfig?.W3C ?? '' }
}

const configurationService = new ConfigurationService()
export default configurationService