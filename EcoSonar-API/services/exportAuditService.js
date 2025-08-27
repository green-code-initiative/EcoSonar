import exceljs from 'exceljs'
import retrieveAnalysisService from './retrieveAnalysisService.js'
import urlConfigurationService from './urlConfigurationService.js'
import SystemError from '../utils/SystemError.js'
import loggerService from '../loggers/traces.js'

class ExportAuditService { }

ExportAuditService.prototype.exportAudit = async function (projectName, res) {
  let urls = []
  let analysis = null

  await urlConfigurationService.getAll(projectName)
    .then((results) => {
      urls = results
    })
    .catch(() => {
      return new SystemError()
    })

  await retrieveAnalysisService.getProjectAnalysis(projectName, res)
    .then((results) => {
      analysis = results
    }).catch(() => {
      return new SystemError()
    })

  if (urls.length === 0 || analysis == null) {
    throw new Error('Export Audit is not possible because urls were not inserted into project or analysis for project could not be retrieved')
  }

  const dateGreenitLastAnalysis = analysis.lastAnalysis.greenit !== null && analysis.lastAnalysis.greenit.dateAnalysis
    ? `${new Date(analysis.lastAnalysis.greenit.dateAnalysis).toDateString()} - ${new Date(analysis.lastAnalysis.greenit.dateAnalysis).toLocaleTimeString([], { hour12: false })}  `
    : null
  const dateLighthouseLastAnalysis = analysis.lastAnalysis.lighthouse !== null && analysis.lastAnalysis.lighthouse.dateAnalysis
    ? `${new Date(analysis.lastAnalysis.lighthouse.dateAnalysis).toDateString()} - ${new Date(analysis.lastAnalysis.lighthouse.dateAnalysis).toLocaleTimeString([], { hour12: false })}  `
    : null
  let dateLastAnalysis = null
  if (dateGreenitLastAnalysis !== null) {
    dateLastAnalysis = dateGreenitLastAnalysis
  } else if (dateLighthouseLastAnalysis !== null) {
    dateLastAnalysis = dateLighthouseLastAnalysis
  }

  let lighthousePerformance, lighthouseAccessibility, lighthouseMetrics
  if (analysis.lastAnalysis.lighthouse) {
    lighthousePerformance = {
      displayValue: analysis.lastAnalysis.lighthouse.performance.displayValue,
      complianceLevel: analysis.lastAnalysis.lighthouse.performance.complianceLevel
    }
    lighthouseAccessibility = {
      displayValue: analysis.lastAnalysis.lighthouse.accessibility.displayValue,
      complianceLevel: analysis.lastAnalysis.lighthouse.accessibility.complianceLevel
    }
    lighthouseMetrics = {
      largestContentfulPaint: {
        displayValue: analysis.lastAnalysis.lighthouse.largestContentfulPaint.displayValue,
        complianceLevel: analysis.lastAnalysis.lighthouse.largestContentfulPaint.complianceLevel,
        score: analysis.lastAnalysis.lighthouse.largestContentfulPaint.score
      },
      firstContentfulPaint: {
        displayValue: analysis.lastAnalysis.lighthouse.firstContentfulPaint.displayValue,
        complianceLevel: analysis.lastAnalysis.lighthouse.firstContentfulPaint.complianceLevel,
        score: analysis.lastAnalysis.lighthouse.firstContentfulPaint.score
      },
      speedIndex: {
        displayValue: analysis.lastAnalysis.lighthouse.speedIndex.displayValue,
        complianceLevel: analysis.lastAnalysis.lighthouse.speedIndex.complianceLevel,
        score: analysis.lastAnalysis.lighthouse.speedIndex.score
      },
      totalBlockingTime: {
        displayValue: analysis.lastAnalysis.lighthouse.totalBlockingTime.displayValue,
        complianceLevel: analysis.lastAnalysis.lighthouse.totalBlockingTime.complianceLevel,
        score: analysis.lastAnalysis.lighthouse.totalBlockingTime.score
      },
      interactive: {
        displayValue: analysis.lastAnalysis.lighthouse.interactive.displayValue,
        complianceLevel: analysis.lastAnalysis.lighthouse.interactive.complianceLevel,
        score: analysis.lastAnalysis.lighthouse.interactive.score
      },
      cumulativeLayoutShift: {
        displayValue: analysis.lastAnalysis.lighthouse.cumulativeLayoutShift.displayValue,
        complianceLevel: analysis.lastAnalysis.lighthouse.cumulativeLayoutShift.complianceLevel,
        score: analysis.lastAnalysis.lighthouse.cumulativeLayoutShift.score
      }
    }
  }
  try {
    const workbook = await new exceljs.Workbook()
    // which tab is active at the openning
    workbook.views = [
      {
        x: 0, y: 0, width: 10000, height: 20000, firstSheet: 0, activeTab: 0, visibility: 'visible'
      }
    ]

    const analysisForProject = {
      analysisGreenit: analysis.lastAnalysis.greenit,
      analysisW3c: analysis.lastAnalysis.w3c,
      lighthouseAccessibility,
      lighthousePerformance,
      lighthouseMetrics
    }
    formatExcelSheet('', 0, workbook, projectName, analysisForProject, dateLastAnalysis)

    for (const [index, url] of urls.entries()) {
      await retrieveAnalysisService.getUrlAnalysis(projectName, url)
        .then((res) => {
          lighthouseAccessibility = res.lastAnalysis.lighthouse !== null ? res.lastAnalysis.lighthouse.accessibility : null
          lighthousePerformance = res.lastAnalysis.lighthouse !== null ? res.lastAnalysis.lighthouse.performance : null

          const analysisForUrl = {
            analysisGreenit: res.lastAnalysis.greenit,
            analysisW3c: res.lastAnalysis.w3c,
            lighthouseAccessibility,
            lighthousePerformance,
            lighthouseMetrics: res.lastAnalysis.lighthouse
          }
          formatExcelSheet(url, index + 1, workbook, projectName, analysisForUrl, dateLastAnalysis)
        })
        .catch(() => {
          loggerService.error('Analysis for URL ' + url + ' could not be resolved ')
        })
    }
    return workbook.xlsx.writeBuffer()
  } catch (err) {
    loggerService.error(err)
    return new Error('Could not export Audit to Excel for projet ' + projectName)
  }
}

function formatExcelSheet (urlName, index, workbook, projectName, analysis, dateLastAnalysis) {
  if (checkAnalysisIsEmpty(analysis)) {
    return
  }

  let sheet
  if (urlName !== '') {
    sheet = workbook.addWorksheet('url' + index)
  } else {
    sheet = workbook.addWorksheet(projectName.replace(":", " "))
  }
  let row = sheet.getRow(1)
  row.getCell(1).value = 'EcoSonar Analysis'
  row.getCell(1).font = {
    bold: true,
    size: 16
  }
  // draw border of the cell
  row.getCell(1).border = {
    top: { style: 'thick' },
    left: { style: 'thick' },
    bottom: { style: 'thick' }
  }

  row.getCell(2).value = 'Date of last analysis'
  row.getCell(3).value = dateLastAnalysis
  // draw border of the cell
  row.getCell(2).border = {
    top: { style: 'thick' },
    bottom: { style: 'thick' }
  }
  // draw border of group the cell
  row.getCell(3).border = {
    top: { style: 'thick' },
    bottom: { style: 'thick' },
    right: { style: 'thick' }
  }
  // formatting
  row.getCell(1).alignment = { wrapText: true }
  row.getCell(2).alignment = { wrapText: true }
  row.getCell(3).alignment = { wrapText: true }

  let rowIndex = 3
  if (urlName !== '') {
    row = sheet.getRow(4)
    row.getCell(1).value = 'Audited Page:'
    row.getCell(1).font = {
      bold: true,
      size: 16
    }
    // draw border of the cell
    row.getCell(1).border = {
      top: { style: 'thick' },
      left: { style: 'thick' },
      bottom: { style: 'thick' }
    }
    row.getCell(2).value = {
      text: urlName,
      hyperlink: urlName,
      tooltip: urlName
    }
    // draw border of the cell
    row.getCell(2).border = {
      top: { style: 'thick' },
      bottom: { style: 'thick' },
      right: { style: 'thick' }
    }
    row.getCell(1).alignment = { wrapText: true }
    row.getCell(2).alignment = { wrapText: true }
    rowIndex = 6
  }
  // score and grade
  row = sheet.getRow(rowIndex)
  row.getCell(1).value = 'EcoIndex project grade (average)'
  if (analysis.analysisGreenit !== null) {
    row.getCell(2).value = analysis.analysisGreenit.grade
    setColor(row.getCell(2), analysis.analysisGreenit.grade)
  } else {
    row.getCell(2).value = 'no analysis'
    setColor(row.getCell(2), '')
  }
  row.getCell(3).value = 'Lighthouse Performance grade (average)'
  if (analysis.lighthousePerformance !== null) {
    row.getCell(4).value = analysis.lighthousePerformance.complianceLevel
    setColor(row.getCell(4), analysis.lighthousePerformance.complianceLevel)
  } else {
    row.getCell(4).value = 'no analysis'
    setColor(row.getCell(4), '')
  }
  row.getCell(5).value = 'Lighthouse Accessibility grade (average)'
  if (analysis.lighthouseAccessibility !== null) {
    row.getCell(6).value = analysis.lighthouseAccessibility.complianceLevel
    setColor(row.getCell(6), analysis.lighthouseAccessibility.complianceLevel)
  } else {
    row.getCell(6).value = 'no analysis'
    setColor(row.getCell(6), '')
  }
  row.getCell(7).value = 'W3C validator grade'
  if (analysis.analysisW3c !== null) {
    row.getCell(8).value = analysis.analysisW3c.grade
    setColor(row.getCell(8), analysis.analysisW3c.grade)
  } else {
    row.getCell(8).value = 'no analysis'
    setColor(row.getCell(8), '')
  }
  // draw border of the cell
  row.getCell(1).border = {
    top: { style: 'thick' },
    left: { style: 'thick' }
  }
  row.getCell(2).border = {
    top: { style: 'thick' },
    right: { style: 'thick' }
  }
  row.getCell(3).border = {
    top: { style: 'thick' }
  }
  row.getCell(4).border = {
    top: { style: 'thick' },
    right: { style: 'thick' }
  }
  row.getCell(5).border = {
    top: { style: 'thick' }
  }
  row.getCell(6).border = {
    top: { style: 'thick' },
    right: { style: 'thick' }
  }
  row.getCell(7).border = {
    top: { style: 'thick' }
  }
  row.getCell(8).border = {
    top: { style: 'thick' },
    right: { style: 'thick' }
  }
  // formatting
  row.getCell(1).alignment = { wrapText: true }
  row.getCell(2).alignment = { wrapText: true }
  row.getCell(3).alignment = { wrapText: true }
  row.getCell(4).alignment = { wrapText: true }
  row.getCell(5).alignment = { wrapText: true }
  row.getCell(6).alignment = { wrapText: true }
  row.getCell(7).alignment = { wrapText: true }
  row.getCell(8).alignment = { wrapText: true }
  rowIndex++

  row = sheet.getRow(rowIndex)
  row.getCell(1).value = 'EcoIndex project score (average)'
  if (analysis.analysisGreenit !== null) {
    row.getCell(2).value = analysis.analysisGreenit.ecoIndex
    setColor(row.getCell(2), analysis.analysisGreenit.grade)
  } else {
    row.getCell(2).value = 'no analysis'
    setColor(row.getCell(2), '')
  }
  row.getCell(3).value = 'Lighthouse Performance score (average)'
  if (analysis.lighthousePerformance !== null) {
    row.getCell(4).value = analysis.lighthousePerformance.displayValue
    setColor(row.getCell(4), analysis.lighthousePerformance.complianceLevel)
  } else {
    row.getCell(4).value = 'no analysis'
    setColor(row.getCell(4), '')
  }
  row.getCell(5).value = 'Lighthouse Accessibility score (average)'
  if (analysis.lighthouseAccessibility !== null) {
    row.getCell(6).value = analysis.lighthouseAccessibility.displayValue
    setColor(row.getCell(6), analysis.lighthouseAccessibility.complianceLevel)
  } else {
    row.getCell(6).value = 'no analysis'
    setColor(row.getCell(6), '')
  }
  row.getCell(7).value = 'W3C validator score'
  if (analysis.analysisW3c !== null) {
    row.getCell(8).value = analysis.analysisW3c.score
    setColor(row.getCell(8), analysis.analysisW3c.grade)
  } else {
    row.getCell(8).value = 'no analysis'
    setColor(row.getCell(8), '')
  }
  // draw border of the cell
  row.getCell(1).border = {
    left: { style: 'thick' },
    bottom: { style: 'thick' }
  }
  row.getCell(2).border = {
    bottom: { style: 'thick' },
    right: { style: 'thick' }
  }
  row.getCell(3).border = {
    bottom: { style: 'thick' }
  }
  row.getCell(4).border = {
    bottom: { style: 'thick' },
    right: { style: 'thick' }
  }
  row.getCell(5).border = {
    bottom: { style: 'thick' }
  }
  row.getCell(6).border = {
    bottom: { style: 'thick' },
    right: { style: 'thick' }
  }
  row.getCell(7).border = {
    bottom: { style: 'thick' }
  }
  row.getCell(8).border = {
    bottom: { style: 'thick' },
    right: { style: 'thick' }
  }
  // formatting
  row.getCell(1).alignment = { wrapText: true }
  row.getCell(2).alignment = { wrapText: true }
  row.getCell(3).alignment = { wrapText: true }
  row.getCell(4).alignment = { wrapText: true }
  row.getCell(5).alignment = { wrapText: true }
  row.getCell(6).alignment = { wrapText: true }
  row.getCell(7).alignment = { wrapText: true }
  row.getCell(8).alignment = { wrapText: true }
  rowIndex++

  // greenit Analysis metrics
  rowIndex++
  row = sheet.getRow(rowIndex)
  row.getCell(1).value = 'GreenIT-Analysis Metrics:'
  row.getCell(1).font = {
    bold: true,
    size: 14
  }
  // formatting
  row.getCell(1).alignment = { wrapText: true }
  rowIndex++
  // draw border of the cell
  row.getCell(1).border = {
    top: { style: 'thick' },
    left: { style: 'thick' }
  }
  row.getCell(2).border = {
    top: { style: 'thick' }
  }
  row.getCell(3).border = {
    right: { style: 'thick' },
    top: { style: 'thick' }
  }
  row = sheet.getRow(rowIndex)
  if (analysis.analysisGreenit !== null) {
    row.getCell(1).value = 'Size of the DOM (average)'
    row.getCell(2).value = analysis.analysisGreenit.domSize.displayValue
    row.getCell(3).value = analysis.analysisGreenit.domSize.complianceLevel
    setColor(row.getCell(3), analysis.analysisGreenit.domSize.complianceLevel)
    // formatting
    row.getCell(1).alignment = { wrapText: true }
    row.getCell(2).alignment = { wrapText: true }
    row.getCell(3).alignment = { wrapText: true }
    rowIndex++
    // draw border of the cell
    row.getCell(1).border = {
      left: { style: 'thick' }
    }
    row.getCell(3).border = {
      right: { style: 'thick' }
    }
    row = sheet.getRow(rowIndex)
    row.getCell(1).value = 'Number of requests (average)'
    row.getCell(2).value = analysis.analysisGreenit.nbRequest.displayValue
    row.getCell(3).value = analysis.analysisGreenit.nbRequest.complianceLevel
    setColor(row.getCell(3), analysis.analysisGreenit.nbRequest.complianceLevel)
    // draw border of the cell
    row.getCell(1).border = {
      left: { style: 'thick' }
    }
    row.getCell(3).border = {
      right: { style: 'thick' }
    }
    // formatting
    row.getCell(1).alignment = { wrapText: true }
    row.getCell(2).alignment = { wrapText: true }
    row.getCell(3).alignment = { wrapText: true }
    rowIndex++

    row = sheet.getRow(rowIndex)
    row.getCell(1).value = 'Size of the page (Kb) (average)'
    row.getCell(2).value = analysis.analysisGreenit.responsesSize.displayValue
    row.getCell(3).value = analysis.analysisGreenit.responsesSize.complianceLevel
    setColor(row.getCell(3), analysis.analysisGreenit.responsesSize.complianceLevel)
    // draw border of the cell
    row.getCell(1).border = {
      left: { style: 'thick' },
      bottom: { style: 'thick' }
    }
    row.getCell(2).border = {
      bottom: { style: 'thick' }
    }
    row.getCell(3).border = {
      right: { style: 'thick' },
      bottom: { style: 'thick' }
    }
    // formatting
    row.getCell(1).alignment = { wrapText: true }
    row.getCell(2).alignment = { wrapText: true }
    row.getCell(3).alignment = { wrapText: true }
    rowIndex++
  } else {
    row.getCell(1).value = 'no analysis'
    setColor(row.getCell(1), '')
    // draw border of the cell
    row.getCell(1).border = {
      bottom: { style: 'thick' },
      left: { style: 'thick' }
    }
    row.getCell(2).border = {
      bottom: { style: 'thick' }
    }
    row.getCell(3).border = {
      bottom: { style: 'thick' }
    }
    row.getCell(4).border = {
      right: { style: 'thick' },
      bottom: { style: 'thick' }
    }
    rowIndex++
  }

  // Lighthouse performance metrics
  rowIndex++
  row = sheet.getRow(rowIndex)
  row.getCell(1).value = 'Lighthouse Performance Metrics:'
  row.getCell(1).font = {
    bold: true,
    size: 14
  }
  // formatting
  row.getCell(1).alignment = { wrapText: true }
  rowIndex++
  // draw border of the cell
  row.getCell(1).border = {
    top: { style: 'thick' },
    left: { style: 'thick' }
  }
  row.getCell(2).border = {
    top: { style: 'thick' }
  }
  row.getCell(3).border = {
    top: { style: 'thick' }
  }
  row.getCell(4).border = {
    right: { style: 'thick' },
    top: { style: 'thick' }
  }

  row = sheet.getRow(rowIndex)
  if (analysis.lighthouseMetrics !== null) {
    row.getCell(1).value = 'Largest Contentful Paint (s) (average)'
    row.getCell(2).value = analysis.lighthouseMetrics.largestContentfulPaint.displayValue
    row.getCell(3).value = analysis.lighthouseMetrics.largestContentfulPaint.complianceLevel
    row.getCell(4).value = analysis.lighthouseMetrics.largestContentfulPaint.score
    setColor(row.getCell(3), analysis.lighthouseMetrics.largestContentfulPaint.complianceLevel)
    setColor(row.getCell(4), analysis.lighthouseMetrics.largestContentfulPaint.complianceLevel)
    // draw border of the cell
    row.getCell(1).border = {
      left: { style: 'thick' }
    }
    row.getCell(4).border = {
      right: { style: 'thick' }
    }
    // formatting
    row.getCell(1).alignment = { wrapText: true }
    row.getCell(2).alignment = { wrapText: true }
    row.getCell(3).alignment = { wrapText: true }
    row.getCell(4).alignment = { wrapText: true }
    rowIndex++

    row = sheet.getRow(rowIndex)
    row.getCell(1).value = 'Cumulative Layout Shift (average)'
    row.getCell(2).value = analysis.lighthouseMetrics.cumulativeLayoutShift.displayValue
    row.getCell(3).value = analysis.lighthouseMetrics.cumulativeLayoutShift.complianceLevel
    row.getCell(4).value = analysis.lighthouseMetrics.cumulativeLayoutShift.score
    setColor(row.getCell(3), analysis.lighthouseMetrics.cumulativeLayoutShift.complianceLevel)
    setColor(row.getCell(4), analysis.lighthouseMetrics.cumulativeLayoutShift.complianceLevel)
    // draw border of the cell
    row.getCell(1).border = {
      left: { style: 'thick' }
    }
    row.getCell(4).border = {
      right: { style: 'thick' }
    }
    // formatting
    row.getCell(1).alignment = { wrapText: true }
    row.getCell(2).alignment = { wrapText: true }
    row.getCell(3).alignment = { wrapText: true }
    row.getCell(4).alignment = { wrapText: true }
    rowIndex++

    row = sheet.getRow(rowIndex)
    row.getCell(1).value = 'First Contentful Paint (s) (average)'
    row.getCell(2).value = analysis.lighthouseMetrics.firstContentfulPaint.displayValue
    row.getCell(3).value = analysis.lighthouseMetrics.firstContentfulPaint.complianceLevel
    row.getCell(4).value = analysis.lighthouseMetrics.firstContentfulPaint.score
    setColor(row.getCell(3), analysis.lighthouseMetrics.firstContentfulPaint.complianceLevel)
    setColor(row.getCell(4), analysis.lighthouseMetrics.firstContentfulPaint.complianceLevel)
    // draw border of the cell
    row.getCell(1).border = {
      left: { style: 'thick' }
    }
    row.getCell(4).border = {
      right: { style: 'thick' }
    }
    // formatting
    row.getCell(1).alignment = { wrapText: true }
    row.getCell(2).alignment = { wrapText: true }
    row.getCell(3).alignment = { wrapText: true }
    row.getCell(4).alignment = { wrapText: true }
    rowIndex++

    row = sheet.getRow(rowIndex)
    row.getCell(1).value = 'Speed Index (s) (average)'
    row.getCell(2).value = analysis.lighthouseMetrics.speedIndex.displayValue
    row.getCell(3).value = analysis.lighthouseMetrics.speedIndex.complianceLevel
    row.getCell(4).value = analysis.lighthouseMetrics.speedIndex.score
    setColor(row.getCell(3), analysis.lighthouseMetrics.speedIndex.complianceLevel)
    setColor(row.getCell(4), analysis.lighthouseMetrics.speedIndex.complianceLevel)
    // draw border of the cell
    row.getCell(1).border = {
      left: { style: 'thick' }
    }
    row.getCell(4).border = {
      right: { style: 'thick' }
    }
    // formatting
    row.getCell(1).alignment = { wrapText: true }
    row.getCell(2).alignment = { wrapText: true }
    row.getCell(3).alignment = { wrapText: true }
    row.getCell(4).alignment = { wrapText: true }
    rowIndex++

    row = sheet.getRow(rowIndex)
    row.getCell(1).value = 'Total Blocking Time (ms) (average)'
    row.getCell(2).value = analysis.lighthouseMetrics.totalBlockingTime.displayValue
    row.getCell(3).value = analysis.lighthouseMetrics.totalBlockingTime.complianceLevel
    row.getCell(4).value = analysis.lighthouseMetrics.totalBlockingTime.score
    setColor(row.getCell(3), analysis.lighthouseMetrics.totalBlockingTime.complianceLevel)
    setColor(row.getCell(4), analysis.lighthouseMetrics.totalBlockingTime.complianceLevel)
    // draw border of the cell
    row.getCell(1).border = {
      left: { style: 'thick' }
    }
    row.getCell(4).border = {
      right: { style: 'thick' }
    }
    // formatting
    row.getCell(1).alignment = { wrapText: true }
    row.getCell(2).alignment = { wrapText: true }
    row.getCell(3).alignment = { wrapText: true }
    row.getCell(4).alignment = { wrapText: true }
    rowIndex++

    row = sheet.getRow(rowIndex)
    row.getCell(1).value = 'Time to interactive (s) (average)'
    row.getCell(2).value = analysis.lighthouseMetrics.interactive.displayValue
    row.getCell(3).value = analysis.lighthouseMetrics.interactive.complianceLevel
    row.getCell(4).value = analysis.lighthouseMetrics.interactive.score
    setColor(row.getCell(3), analysis.lighthouseMetrics.interactive.complianceLevel)
    setColor(row.getCell(4), analysis.lighthouseMetrics.interactive.complianceLevel)
    // draw border of the cell
    row.getCell(1).border = {
      left: { style: 'thick' },
      bottom: { style: 'thick' }
    }
    row.getCell(2).border = {
      bottom: { style: 'thick' }
    }
    row.getCell(3).border = {
      bottom: { style: 'thick' }
    }
    row.getCell(4).border = {
      right: { style: 'thick' },
      bottom: { style: 'thick' }
    }
    // formatting
    row.getCell(1).alignment = { wrapText: true }
    row.getCell(2).alignment = { wrapText: true }
    row.getCell(3).alignment = { wrapText: true }
    row.getCell(4).alignment = { wrapText: true }
    rowIndex++
  } else {
    row.getCell(1).value = 'no analysis'
    setColor(row.getCell(1), '')
    // draw border of the cell
    row.getCell(1).border = {
      bottom: { style: 'thick' },
      left: { style: 'thick' }
    }
    row.getCell(2).border = {
      bottom: { style: 'thick' }
    }
    row.getCell(3).border = {
      bottom: { style: 'thick' }
    }
    row.getCell(4).border = {
      right: { style: 'thick' },
      bottom: { style: 'thick' }
    }
    rowIndex++
  }

  // W3c validator
  rowIndex++
  row = sheet.getRow(rowIndex)
  row.getCell(1).value = 'W3C Validator Metrics:'
  row.getCell(1).font = {
    bold: true,
    size: 14
  }
  // formatting
  row.getCell(1).alignment = { wrapText: true }
  rowIndex++
  // draw border of the cell
  row.getCell(1).border = {
    top: { style: 'thick' },
    left: { style: 'thick' }
  }
  row.getCell(2).border = {
    top: { style: 'thick' },
    right: { style: 'thick' }
  }

  row = sheet.getRow(rowIndex)
  if (analysis.analysisW3c !== null) {
    row.getCell(1).value = 'Number of Infos'
    row.getCell(2).value = analysis.analysisW3c.totalInfo
    // formatting
    row.getCell(1).alignment = { wrapText: true }
    row.getCell(2).alignment = { wrapText: true }
    rowIndex++
    // draw border of the cell
    row.getCell(1).border = {
      left: { style: 'thick' }
    }
    row.getCell(2).border = {
      right: { style: 'thick' }
    }
    row = sheet.getRow(rowIndex)
    row.getCell(1).value = 'Number of Warnings'
    row.getCell(2).value = analysis.analysisW3c.totalWarning
    // formatting
    row.getCell(1).alignment = { wrapText: true }
    row.getCell(2).alignment = { wrapText: true }
    rowIndex++
    // draw border of the cell
    row.getCell(1).border = {
      left: { style: 'thick' }
    }
    row.getCell(2).border = {
      right: { style: 'thick' }
    }
    row = sheet.getRow(rowIndex)
    row.getCell(1).value = 'Number of Errors'
    row.getCell(2).value = analysis.analysisW3c.totalError
    // formatting
    row.getCell(1).alignment = { wrapText: true }
    row.getCell(2).alignment = { wrapText: true }
    rowIndex++
    // draw border of the cell
    row.getCell(1).border = {
      left: { style: 'thick' }
    }
    row.getCell(2).border = {
      right: { style: 'thick' }
    }
    row = sheet.getRow(rowIndex)
    row.getCell(1).value = 'Number of Fatal Errors'
    row.getCell(2).value = analysis.analysisW3c.totalFatalError
    // draw border of the cell
    row.getCell(1).border = {
      left: { style: 'thick' },
      bottom: { style: 'thick' }
    }
    row.getCell(2).border = {
      right: { style: 'thick' },
      bottom: { style: 'thick' }
    }

    // formatting
    row.getCell(1).alignment = { wrapText: true }
    row.getCell(2).alignment = { wrapText: true }
  } else {
    row.getCell(1).value = 'no analysis'
    setColor(row.getCell(1), '')
    // draw border of the cell
    row.getCell(1).border = {
      left: { style: 'thick' },
      bottom: { style: 'thick' }
    }
    row.getCell(2).border = {
      right: { style: 'thick' },
      bottom: { style: 'thick' }
    }
  }

  // Adapting each column's size to view all text
  sheet.columns.forEach(function (column) {
    let maxLength = 0
    column.eachCell({ includeEmpty: true }, function (cell) {
      const columnLength = cell.value ? cell.value.toString().length : 10
      if (columnLength > maxLength) {
        maxLength = columnLength
      }
    })
    column.width = maxLength < 10 ? 10 : maxLength
  })
}

function setColor (cell, grade) {
  let couleur
  if (grade === 'A' || grade === 'B') {
    couleur = '0cf000'
  } else if (grade === 'C' || grade === 'D') {
    couleur = 'ff9500'
  } else if (grade === 'E' || grade === 'F' || grade === 'G') {
    couleur = 'FF3A3A'
  } else {
    couleur = 'e6e6e6'
  }
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: couleur }
  }
}

function checkAnalysisIsEmpty (analysis) {
  return analysis.analysisGreenit === null && analysis.analysisW3c === null && analysis.lighthouseMetrics === null
}

const exportAuditService = new ExportAuditService()
export default exportAuditService
