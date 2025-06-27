export interface CoverageData {
  lineRate: number
  branchRate: number
  complexity: number
  timestamp: string
  packages: PackageData[]
}

export interface PackageData {
  name: string
  lineRate: number
  branchRate: number
  complexity: number
  classes: ClassData[]
}

export interface ClassData {
  name: string
  filename: string
  lineRate: number
  branchRate: number
  complexity: number
  methods: MethodData[]
  lines: LineData[]
}

export interface MethodData {
  name: string
  signature: string
  lineRate: number
  branchRate: number
  complexity: number
}

export interface LineData {
  number: number
  hits: number
  branch: boolean
  conditionCoverage?: string
}

export class CoberturaParser {
  private xmlObject: any

  constructor(xmlObject: any) {
    this.xmlObject = xmlObject
  }

  public parse(changedFiles: string[], fileRegEx: string): CoverageData {
    const coverage = this.xmlObject.coverage

    if (!coverage) {
      throw new Error('Invalid Cobertura XML: missing coverage element')
    }

    console.log(`Regex files: ${fileRegEx}`)
    changedFiles = changedFiles.map((file) => file.replace(/\\/g, '/'))
    console.log(`Changed files: ${changedFiles}`)

    // Loop through the pacakges
    const packages: PackageData[] = []
    for (const pkg of coverage.packages?.[0]?.package || []) {
      const newPkg: PackageData = {
        name: pkg.$?.name || '',
        lineRate: parseFloat(pkg.$?.['line-rate'] || '0'),
        branchRate: parseFloat(pkg.$?.['branch-rate'] || '0'),
        complexity: parseInt(pkg.$?.complexity || '0', 10),
        classes: []
      }

      newPkg.classes = this.parseClasses(pkg.classes?.[0]?.class || [])
      packages.push(newPkg)
    }
    return {
      lineRate: parseFloat(coverage.$?.['line-rate'] || '0'),
      branchRate: parseFloat(coverage.$?.['branch-rate'] || '0'),
      complexity: parseInt(coverage.$?.complexity || '0', 10),
      timestamp: coverage.$?.timestamp || '',
      packages: this.parsePackages(coverage.packages?.[0]?.package || [])
    }
  }

  private parsePackages(packages: any[]): PackageData[] {
    if (!Array.isArray(packages)) {
      packages = [packages]
    }

    return packages.map((pkg) => ({
      name: pkg.$?.name || '',
      lineRate: parseFloat(pkg.$?.['line-rate'] || '0'),
      branchRate: parseFloat(pkg.$?.['branch-rate'] || '0'),
      complexity: parseInt(pkg.$?.complexity || '0', 10),
      classes: this.parseClasses(pkg.classes?.[0]?.class || [])
    }))
  }

  private parseClasses(classes: any[]): ClassData[] {
    if (!Array.isArray(classes)) {
      classes = [classes]
    }

    return classes.map((cls) => ({
      name: cls.$?.name || '',
      filename: cls.$?.filename || '',
      lineRate: parseFloat(cls.$?.['line-rate'] || '0'),
      branchRate: parseFloat(cls.$?.['branch-rate'] || '0'),
      complexity: parseInt(cls.$?.complexity || '0', 10),
      methods: this.parseMethods(cls.methods?.[0]?.method || []),
      lines: this.parseLines(cls.lines?.[0]?.line || [])
    }))
  }

  private parseMethods(methods: any[]): MethodData[] {
    if (!Array.isArray(methods)) {
      methods = [methods]
    }

    return methods.map((method) => ({
      name: method.$?.name || '',
      signature: method.$?.signature || '',
      lineRate: parseFloat(method.$?.['line-rate'] || '0'),
      branchRate: parseFloat(method.$?.['branch-rate'] || '0'),
      complexity: parseInt(method.$?.complexity || '0', 10)
    }))
  }

  private parseLines(lines: any[]): LineData[] {
    if (!Array.isArray(lines)) {
      lines = [lines]
    }

    return lines.map((line) => ({
      number: parseInt(line.$?.number || '0', 10),
      hits: parseInt(line.$?.hits || '0', 10),
      branch: line.$?.branch === 'true',
      conditionCoverage: line.$?.['condition-coverage']
    }))
  }
}
