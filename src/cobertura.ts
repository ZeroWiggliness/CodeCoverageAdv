export interface CoberturaCoverageData {
  _lineValid: number
  _lineCovered: number
  _lineRate: number
  _branchesValid: number
  _branchesCovered: number
  _branchRate: number
  _complexity: number
  _timestamp: string
  _version: string
  sources: any[]
  packages: PackagesData
}

export interface PackagesData {
  package: PackageData[]
}

export interface PackageData {
  _name: string
  _lineRate: number
  _branchRate: number
  _complexity: number
  classes: ClassesData
}

export interface ClassesData {
  class: ClassData[]
}

export interface ClassData {
  _name: string
  _filename: string
  _lineRate: number
  _branchRate: number
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
  _lineRate: number
  _branchRate: number
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

  constructor(xmlObject: any) {
    this.xmlObject = xmlObject
  }

  private toArrayIfNot(array: any): any[] {
    if (array === undefined || array === null) {
      return []
    }
    return Array.isArray(array) ? array : [array]
  }

  private convertToCoberturaCoverageData(
    xmlObject: any
  ): CoberturaCoverageData {
    const newData: CoberturaCoverageData = {
      _lineValid: 0,
      _lineCovered: 0,
      _lineRate: 0,
      _branchesCovered: 0,
      _branchesValid: 0,
      _branchRate: 0,
      _complexity: 0,
      _version: xmlObject._version,
      _timestamp: xmlObject._timestamp,
      packages: this.convertToPackagesData(
        this.toArrayIfNot(xmlObject.packages.package)
      ),
      sources: []
    }

    return newData
  }

  private convertToPackagesData(packages: any[]): PackagesData {
    return {
      package: packages.map((pkg) => ({
        _name: pkg?._name || '',
        _lineRate: parseFloat(pkg['_line-rate'] || '0'),
        _branchRate: parseFloat(pkg['_branch-rate'] || '0'),
        _complexity: parseInt(pkg?._complexity || '0', 10),
        classes: this.convertToClassesData(this.toArrayIfNot(pkg.classes.class))
      }))
    }
  }

  private convertToClassesData(classes: any[]): ClassesData {
    const coberturaClasses = classes.map((cls) => ({
      _name: cls.name || '',
      _filename: cls._filename || '',
      _lineRate: parseFloat(cls?.['_line-rate'] || '0'),
      _branchRate: parseFloat(cls?.['_branch-rate'] || '0'),
      _complexity: parseInt(cls?._complexity || '0', 10),
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
        _lineRate: parseFloat(meth['_line-rate'] || '0'),
        _branchRate: parseFloat(meth['_branch-rate'] || '0'),
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
        _branch:
          line._branch === undefined
            ? 'false'
            : line._branch == 'true'
              ? 'true'
              : 'false',
        _conditionCoverage: line['_condition-coverage']
      }))
    }
  }

  public parse(changedFiles: string[]): CoberturaCoverageData {
    const coverage = this.xmlObject.coverage
    if (!coverage) {
      throw new Error('Invalid Cobertura XML: missing coverage element')
    }

    const coberuraCoverage = this.convertToCoberturaCoverageData(coverage)
    coberuraCoverage.packages.package.forEach((pkg) => {
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
    coberuraCoverage.packages.package.forEach((pkg) => {
      let pkgLinesCount = 0
      let pkgHitsCount = 0
      let pkgBranchCount = 0
      let pkgBranchHitsCount = 0

      pkg.classes.class.forEach((cls) => {
        const classBranchAllFalse = cls.lines.line.every(
          (line) => line._branch == 'false'
        )

        let classLinesCount = cls.lines.line.length
        let classHitsCount = cls.lines.line.reduce(
          (acc, line) => acc + (line._hits > 0 ? 1 : 0),
          0
        )
        let classBranchCount = classLinesCount
        let classBranchHitsCount = classLinesCount

        if (!classBranchAllFalse) {
          classBranchCount = 0
          classBranchHitsCount = 0

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
        }

        // Set methods lineRate, branchRate, and complexity
        cls.methods.method.forEach((meth) => {
          const methodBranchAllFalse = meth.lines.line.every(
            (line) => line._branch == 'false'
          )

          const methodLinesCount = meth.lines.line.length
          const methodHitsCount = meth.lines.line.reduce(
            (acc, line) => acc + (line._hits > 0 ? 1 : 0),
            0
          )

          let methodBranchCount = methodLinesCount
          let methodBranchHitsCount = methodLinesCount

          if (!methodBranchAllFalse) {
            methodBranchCount = 0
            methodBranchHitsCount = 0

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
          }

          meth._lineRate = methodHitsCount / methodLinesCount
          meth._branchRate = methodBranchHitsCount / methodBranchCount
          meth._complexity = Number.NaN

          classLinesCount += methodLinesCount
          classHitsCount += methodHitsCount
          classBranchCount += methodLinesCount
          classBranchHitsCount += methodHitsCount
        })

        cls._lineRate = classHitsCount / classLinesCount
        cls._branchRate = classBranchHitsCount / classBranchCount
        cls._complexity = Number.NaN

        pkgLinesCount += classLinesCount
        pkgHitsCount += classHitsCount
        pkgBranchCount += classBranchCount
        pkgBranchHitsCount += classBranchHitsCount
      })

      pkg._lineRate = pkgHitsCount / pkgLinesCount
      pkg._branchRate = pkgBranchHitsCount / pkgBranchCount
      pkg._complexity = Number.NaN

      coberturaLinesCount += pkgLinesCount
      coberturaHitsCount += pkgHitsCount
      coberturaBranchCount += pkgBranchCount
      coberturaBranchHitsCount += pkgBranchHitsCount
    })

    coberuraCoverage._lineRate = coberturaHitsCount / coberturaLinesCount
    coberuraCoverage._lineCovered = coberturaHitsCount
    coberuraCoverage._lineValid = coberturaLinesCount
    coberuraCoverage._branchRate =
      coberturaBranchHitsCount / coberturaBranchCount
    coberuraCoverage._branchesCovered = coberturaBranchesCovered
    coberuraCoverage._branchesValid = coberturaBranchesValid
    coberuraCoverage._complexity = Number.NaN

    return coberuraCoverage
  }
}
