import React from 'react'
import { getUrlsConfiguration } from '../../services/configUrlService'
import { getAnalysisForProjectConfiguration } from '../../services/ecoSonarService'
import AnalysisPanel from './AnalysisPanel'
import DisclaimerPanel from './IndexPanel/DisclaimerPanel'
import EcoIndexPanel from './IndexPanel/EcoIndexPanel'
import LighthouseAccessibilityPanel from './IndexPanel/LighthouseAccessibilityPanel'
import LighthousePerformancePanel from './IndexPanel/LighthousePerformancePanel'
import W3cPanel from './IndexPanel/W3cPanel'
import NoAnalysisWarning from './NoAnalysisWarning'

export default class EcoSonarAnalysisPage extends React.PureComponent {
  constructor () {
    super()
    this.state = {
      allowW3c: '',
      projectHasNoAnalysis: false,
      loading: true,
      projectName: '',
      analysisForProjectGreenit: {},
      lighthousePerformanceForProject: {},
      lighthouseAccessibilityForProject: {},
      lighthouseMetrics: {
        largestContentfulPaint: {},
        cumulativeLayoutShift: {},
        firstContentfulPaint: {},
        speedIndex: {},
        totalBlockingTime: {},
        interactive: {}
      },
      urls: [],
      foundUrl: false,
      selectedUrl: false,
      errorUrl: '',
      error: '',
      reqAnalysis: [],
      domAnalysis: [],
      pageAnalysis: [],
      ecoAnalysis: [],
      performanceAnalysis: [],
      accessibilityAnalysis: [],
      cumulativeLayoutshiftAnalysis: [],
      firstContentfulPaintAnalysis: [],
      largestContentfulPaintAnalysis: [],
      interactiveAnalysis: [],
      speedIndexAnalysis: [],
      totalBlockingTimeAnalysis: [],
      found: false,
      date: ''
    }
  }

  componentDidMount () {
    this.setState({
      loading: true,
      error: '',
      date: '',
      found: false,
      projectHasNoAnalysis: false,
      urls: [],
      foundUrl: false,
      selectedUrl: false,
      errorUrl: '',
      projectName: this.props.project.key
    })
    this.initEcoSonarAnalysisPage(this.props.project.key)
  }

  initEcoSonarAnalysisPage (projectName) {
    getAnalysisForProjectConfiguration(projectName)
      .then((analysis) => {
        if (analysis !== undefined && analysis.lastAnalysis.greenit !== null && analysis.lastAnalysis.lighthouse !== null && (analysis.allowW3c === 'false' || analysis.lastAnalysis.w3c !== null) && analysis.deployments.greenit.length !== 0 && analysis.deployments.lighthouse.length !== 0 && (analysis.allowW3c === 'false' || analysis.deployments.w3c.length !== 0)) {
          const dateGreenitLastAnalysis = analysis.lastAnalysis.greenit !== null && analysis.lastAnalysis.greenit.dateAnalysis
            ? `${new Date(analysis.lastAnalysis.greenit.dateAnalysis).toDateString()} - ${new Date(analysis.lastAnalysis.greenit.dateAnalysis).toLocaleTimeString([], { hour12: false })}  `
            : null
          const dateLighthouseLastAnalysis = analysis.lastAnalysis.lighthouse !== null && analysis.lastAnalysis.lighthouse.dateAnalysis
            ? `${new Date(analysis.lastAnalysis.lighthouse.dateAnalysis).toDateString()} - ${new Date(analysis.lastAnalysis.lighthouse.dateAnalysis).toLocaleTimeString([], { hour12: false })}  `
            : null

          // W3C Analysis can be empty
          const dateW3cLastAnalysis = analysis.lastAnalysis.w3c !== null
            ? (`${new Date(analysis.lastAnalysis.w3c.dateAnalysis).toDateString()} - ${new Date(analysis.lastAnalysis.w3c.dateAnalysis).toLocaleTimeString([], {
              hour12: false
            })}  `)
            : null
          this.setState({
            allowW3c: analysis.allowW3c,
            analysisForProjectGreenit: analysis.lastAnalysis.greenit,
            analysisForProjectW3c: analysis.lastAnalysis.w3c,
            found: true,
            dateGreenitLastAnalysis,
            dateLighthouseLastAnalysis,
            dateW3cLastAnalysis,
            defaultSelectedGraph: analysis.lastAnalysis.greenit !== null ? 'ecoindex' : 'performance',
            defaultEcoindexSelected: analysis.lastAnalysis.greenit !== null,
            defaultPerformanceSelected: analysis.lastAnalysis.greenit === null,
            reqAnalysis: analysis.deployments.greenit.map((reqObject) => [reqObject.dateAnalysis, reqObject.nbRequest]),
            domAnalysis: analysis.deployments.greenit.map((domObject) => [domObject.dateAnalysis, Math.trunc(domObject.domSize)]),
            pageAnalysis: analysis.deployments.greenit.map((pageObject) => [pageObject.dateAnalysis, Math.trunc(pageObject.responsesSize)]),
            ecoAnalysis: analysis.deployments.greenit.map((ecoindexObject) => [ecoindexObject.dateAnalysis, ecoindexObject.ecoIndex]),
            performanceAnalysis: analysis.deployments.lighthouse.map((perfObject) => [perfObject.dateAnalysis, perfObject.performanceScore]),
            accessibilityAnalysis: analysis.deployments.lighthouse.map((accessObject) => [accessObject.dateAnalysis, accessObject.accessibilityScore]),
            cumulativeLayoutshiftAnalysis: analysis.deployments.lighthouse.map((clsObject) => [clsObject.dateAnalysis, clsObject.cumulativeLayoutShift]),
            firstContentfulPaintAnalysis: analysis.deployments.lighthouse.map((fcpObject) => [fcpObject.dateAnalysis, fcpObject.firstContentfulPaint]),
            largestContentfulPaintAnalysis: analysis.deployments.lighthouse.map((lcpObject) => [lcpObject.dateAnalysis, lcpObject.largestContentfulPaint]),
            interactiveAnalysis: analysis.deployments.lighthouse.map((intObject) => [intObject.dateAnalysis, intObject.interactive]),
            speedIndexAnalysis: analysis.deployments.lighthouse.map((siObject) => [siObject.dateAnalysis, siObject.speedIndex]),
            totalBlockingTimeAnalysis: analysis.deployments.lighthouse.map((tbtObject) => [tbtObject.dateAnalysis, tbtObject.totalBlockingTime]),
            w3cAnalysis: analysis.deployments.w3c.map((w3cObject) => [w3cObject.dateAnalysis, w3cObject.score])
          })
          if (analysis.lastAnalysis.lighthouse) {
            this.setState({
              lighthousePerformanceForProject: {
                perfScore: analysis.lastAnalysis.lighthouse.performance.displayValue,
                perfComplianceLevel: analysis.lastAnalysis.lighthouse.performance.complianceLevel
              },
              lighthouseAccessibilityForProject: {
                accessScore: analysis.lastAnalysis.lighthouse.accessibility.displayValue,
                accessComplianceLevel: analysis.lastAnalysis.lighthouse.accessibility.complianceLevel
              },
              lighthouseMetrics: {
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
            })
          }
        } else {
          this.setState({ projectHasNoAnalysis: true })
        }
      })
      .catch((result) => {
        this.setState({ error: result.message, loading: false })
      })
    getUrlsConfiguration(this.props.project.key)
      .then((urlList) => {
        if (urlList.length > 0) {
          this.setState({
            urls: urlList,
            foundUrl: true,
            loading: false,
            selectedUrl: urlList[0]
          })
        } else {
          this.setState({
            loading: false,
            errorUrl: 'No URL for projet ' + this.projectName + ' found'
          })
        }
      })
      .catch((result) => {
        if (result instanceof Error) {
          this.setState({ errorUrl: result.message, loading: false })
        }
      })
  }

  render () {
    return (
      <main role='main' className='page' aria-hidden='true'>
        <div className='overview'>
          {this.state.loading
            ? (
          <div className='loading'>
            <div className="loader"></div>
          </div>
              )
            : (
                this.EcoSonarAnalysisBody()
              )}
        </div>
      </main>
    )
  }

  EcoSonarAnalysisBody () {
    return this.state.projectHasNoAnalysis
      ? (
        <NoAnalysisWarning projectName={this.state.projectName} />
        )
      : (
        <div className='display-flex-row'>
          <div className='index-panel'>
            <EcoIndexPanel loading={this.state.loading} analysis={this.state.analysisForProjectGreenit} found={this.state.found} />
            <LighthousePerformancePanel loading={this.state.loading} analysis={this.state.lighthousePerformanceForProject} found={this.state.found} />
            <LighthouseAccessibilityPanel loading={this.state.loading} analysis={this.state.lighthouseAccessibilityForProject} found={this.state.found} />
            {this.state.allowW3c === 'true' && <W3cPanel loading={this.state.loading} analysis={this.state.analysisForProjectW3c} found={this.state.found} />}

            <DisclaimerPanel />
          </div>
          <AnalysisPanel
            allowW3c={this.state.allowW3c}
            analysisForProjectGreenit={this.state.analysisForProjectGreenit}
            analysisForProjectW3c={this.state.analysisForProjectW3c}
            lighthouseMetricsForProject={this.state.lighthouseMetrics}
            lighthousePerformanceForProject={this.state.lighthousePerformanceForProject}
            lighthouseAccessibilityForProject={this.state.lighthouseAccessibilityForProject}
            error={this.state.error}
            found={this.state.found}
            project={this.state.projectName}
            urls={this.state.urls}
            foundUrl={this.state.foundUrl}
            selectedUrl={this.state.selectedUrl}
            errorUrl={this.state.errorUrl}
            ecoAnalysis={this.state.ecoAnalysis}
            domAnalysis={this.state.domAnalysis}
            pageAnalysis={this.state.pageAnalysis}
            reqAnalysis={this.state.reqAnalysis}
            performanceAnalysis={this.state.performanceAnalysis}
            accessibilityAnalysis={this.state.accessibilityAnalysis}
            cumulativeLayoutshiftAnalysis={this.state.cumulativeLayoutshiftAnalysis}
            firstContentfulPaintAnalysis={this.state.firstContentfulPaintAnalysis}
            largestContentfulPaintAnalysis={this.state.largestContentfulPaintAnalysis}
            interactiveAnalysis={this.state.interactiveAnalysis}
            speedIndexAnalysis={this.state.speedIndexAnalysis}
            totalBlockingTimeAnalysis={this.state.totalBlockingTimeAnalysis}
            projectName={this.state.projectName}
            dateGreenitLastAnalysis={this.state.dateGreenitLastAnalysis}
            dateLighthouseLastAnalysis={this.state.dateLighthouseLastAnalysis}
            dateW3cLastAnalysis={this.state.dateW3cLastAnalysis}
            w3cAnalysis={this.state.w3cAnalysis} />
        </div>
        )
  }
}
