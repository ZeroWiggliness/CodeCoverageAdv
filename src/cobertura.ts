export interface CoberturaCoverageData {
  '_lines-valid': number | undefined
  '_lines-covered': number | undefined
  '_line-rate': number | undefined
  '_branches-valid': number | undefined
  '_branches-covered': number | undefined
  '_branch-rate': number | undefined
  _complexity: number | undefined
  _timestamp: string | undefined
  _version: string | undefined
  sources: any[]
  packages: PackagesData
}

export interface PackagesData {
  package: PackageData[]
}

export interface PackageData {
  _name: string
  '_line-rate': number
  '_branch-rate': number
  _complexity: number
  classes: ClassesData
}

export interface ClassesData {
  class: ClassData[]
}

export interface ClassData {
  _name: string
  _filename: string
  '_line-rate': number
  '_branch-rate': number | undefined
  _complexity: number
  methods: MethodsData
  lines: LinesData
}

export interface MethodsData {
  method: MethodData[]
}

export interface MethodData {
  _name: string
  _signature: string
  '_line-rate': number
  '_branch-rate': number | undefined
  _complexity: number
  lines: LinesData
}

export interface LinesData {
  line: LineData[]
}

export interface LineData {
  _number: number
  _hits: number
  _branch: string
  _conditionCoverage: string | undefined
}

export class CoberturaParser {
  private xmlObject: any
  private coberuraOriginalCoverage: CoberturaCoverageData
  private coberuraCoverage: CoberturaCoverageData

  constructor(xmlObject: any) {
    this.xmlObject = xmlObject

    const coverage = this.xmlObject.coverage
    if (!coverage) {
      throw new Error('Invalid Cobertura XML: missing coverage element')
    }

    this.coberuraOriginalCoverage = this.convertToCoberturaCoverageData(coverage)
    this.coberuraCoverage = this.convertToCoberturaCoverageData(coverage)
  }

  public getOriginalCoverage(): CoberturaCoverageData {
    return this.coberuraOriginalCoverage
  }

  public parse(changedFiles: string[]): CoberturaCoverageData {
    // Filter out packages that do not match the changed files
    this.coberuraCoverage.packages.package.forEach((pkg) => {
      pkg.classes.class = pkg.classes.class.filter((cls) => {
        const filename = cls._filename || ''
        return changedFiles.some((file) => {
          const consitantFilename = filename.replace(/\\/g, '/')
          return consitantFilename.includes(file)
        })
      })
    })

    // loops through the packages, then the classes, then the methods and set the lineRate, branchRate, and complexity to 1
    let coberturaLinesCount = 0
    let coberturaBranchesCovered = 0
    let coberturaBranchesValid = 0
    let coberturaHitsCount = 0
    let coberturaBranchCount = 0
    let coberturaBranchHitsCount = 0

    this.coberuraCoverage.packages.package.forEach((pkg) => {
      let pkgLinesCount = 0
      let pkgHitsCount = 0
      let pkgBranchCount = 0
      let pkgBranchHitsCount = 0

      pkg.classes.class.forEach((cls) => {
        let classLinesCount = cls.lines.line.length
        let classHitsCount = cls.lines.line.reduce((acc, line) => acc + (line._hits > 0 ? 1 : 0), 0)
        let classBranchCount = 0
        let classBranchHitsCount = 0

        cls.lines.line.forEach((line) => {
          if (line._branch == 'true' && line._conditionCoverage) {
            const match = line._conditionCoverage.match(/\((\d+)\/(\d+)\)/)
            if (match) {
              classBranchHitsCount += parseInt(match[1], 10)
              classBranchCount += parseInt(match[2], 10)

              coberturaBranchesCovered += parseInt(match[1], 10)
              coberturaBranchesValid += parseInt(match[2], 10)
            }
          }
        })

        // Set methods lineRate, branchRate, and complexity
        cls.methods.method.forEach((meth) => {
          const methodLinesCount = meth.lines.line.length
          const methodHitsCount = meth.lines.line.reduce((acc, line) => acc + (line._hits > 0 ? 1 : 0), 0)

          let methodBranchCount = 0
          let methodBranchHitsCount = 0

          meth.lines.line.forEach((line) => {
            if (line._branch == 'true' && line._conditionCoverage) {
              const match = line._conditionCoverage.match(/\((\d+)\/(\d+)\)/)
              if (match) {
                classBranchHitsCount += parseInt(match[1], 10)
                classBranchCount += parseInt(match[2], 10)

                coberturaBranchesCovered += parseInt(match[1], 10)
                coberturaBranchesValid += parseInt(match[2], 10)
              }
            }
          })

          meth['_line-rate'] = methodHitsCount / methodLinesCount
          meth['_branch-rate'] = methodBranchHitsCount == 0 && methodBranchCount == 0 ? 1 : methodBranchHitsCount / methodBranchCount
          meth._complexity = Number.NaN

          classLinesCount += methodLinesCount
          classHitsCount += methodHitsCount
          classBranchCount += methodLinesCount
          classBranchHitsCount += methodHitsCount
        })

        cls['_lineRate'] = classHitsCount / classLinesCount
        cls['_branch-rate'] = classBranchHitsCount == 0 && classBranchCount == 0 ? 1 : classBranchHitsCount / classBranchCount
        cls._complexity = Number.NaN

        pkgLinesCount += classLinesCount
        pkgHitsCount += classHitsCount
        pkgBranchCount += classBranchCount
        pkgBranchHitsCount += classBranchHitsCount
      })

      pkg['_lineRate'] = pkgHitsCount / pkgLinesCount
      pkg['_branch-rate'] = pkgBranchHitsCount == 0 && pkgBranchCount == 0 ? 1 : pkgBranchHitsCount / pkgBranchCount
      pkg._complexity = Number.NaN

      coberturaLinesCount += pkgLinesCount
      coberturaHitsCount += pkgHitsCount
      coberturaBranchCount += pkgBranchCount
      coberturaBranchHitsCount += pkgBranchHitsCount
    })

    this.coberuraCoverage['_line-rate'] = coberturaHitsCount / coberturaLinesCount
    this.coberuraCoverage['_lines-covered'] = coberturaHitsCount
    this.coberuraCoverage['_lines-valid'] = coberturaLinesCount
    this.coberuraCoverage['_branch-rate'] = coberturaBranchHitsCount / coberturaBranchCount
    this.coberuraCoverage['_branches-covered'] = coberturaBranchesCovered
    this.coberuraCoverage['_branches-valid'] = coberturaBranchesValid
    this.coberuraCoverage._complexity = Number.NaN

    return this.coberuraCoverage
  }

  private toArrayIfNot(array: any): any[] {
    if (array === undefined || array === null) {
      return []
    }
    return Array.isArray(array) ? array : [array]
  }

  private convertToCoberturaCoverageData(xmlObject: any): CoberturaCoverageData {
    const newData: CoberturaCoverageData = {
      '_lines-valid': xmlObject['_lines-valid'] == undefined ? undefined : parseFloat(xmlObject['_lines-valid']),
      '_lines-covered': xmlObject['_lines-covered'] == undefined ? undefined : parseFloat(xmlObject['_lines-covered']),
      '_line-rate': xmlObject['_line-rate'] == undefined ? undefined : parseFloat(xmlObject['_line-rate']),
      '_branches-covered': xmlObject['_branches-covered'] == undefined ? undefined : parseFloat(xmlObject['_branches-covered']),
      '_branches-valid': xmlObject['_branches-valid'] == undefined ? undefined : parseFloat(xmlObject['_branches-valid']),
      '_branch-rate': xmlObject['_branch-rate'] == undefined ? undefined : parseFloat(xmlObject['_branch-rate']),
      _complexity: xmlObject['_complexity'] == undefined ? undefined : parseFloat(xmlObject['_complexity']),
      _version: xmlObject._version,
      _timestamp: xmlObject._timestamp,
      packages: this.convertToPackagesData(this.toArrayIfNot(xmlObject.packages.package)),
      sources: xmlObject.sources?.source
    }

    return newData
  }

  private convertToPackagesData(packages: any[]): PackagesData {
    return {
      package: packages.map((pkg) => ({
        _name: pkg?._name || '',
        '_line-rate': parseFloat(pkg['_line-rate'] || '0'),
        '_branch-rate': parseFloat(pkg['_branch-rate'] || '0'),
        _complexity: parseFloat(pkg?._complexity || '0'),
        classes: this.convertToClassesData(this.toArrayIfNot(pkg.classes.class))
      }))
    }
  }

  private convertToClassesData(classes: any[]): ClassesData {
    const coberturaClasses = classes.map((cls) => ({
      _name: cls.name || '',
      _filename: cls._filename || '',
      '_line-rate': parseFloat(cls?.['_line-rate'] || '0'),
      '_branch-rate': parseFloat(cls?.['_branch-rate'] || '0'),
      _complexity: parseFloat(cls?._complexity || '0'),
      methods: this.convertToMethodsData(this.toArrayIfNot(cls.methods.method)),
      lines: this.convertToLinesData(this.toArrayIfNot(cls.lines.line))
    }))

    return {
      class: coberturaClasses
    }
  }

  private convertToMethodsData(methods: any[]): MethodsData {
    return {
      method: methods.map((meth) => ({
        _name: meth._name || '',
        _signature: meth?._signature || '',
        '_line-rate': parseFloat(meth['_line-rate'] || '0'),
        '_branch-rate': parseFloat(meth['_branch-rate'] || '0'),
        _complexity: parseFloat(meth?._complexity || '0'),
        lines: this.convertToLinesData(this.toArrayIfNot(meth.lines.line))
      }))
    }
  }

  private convertToLinesData(lines: any[]): LinesData {
    return {
      line: lines.map((line) => ({
        _number: parseInt(line?._number || '0', 10),
        _hits: parseInt(line?._hits || '0', 10),
        _branch: line._branch,
        _conditionCoverage: line['_condition-coverage']
      }))
    }
  }
}
