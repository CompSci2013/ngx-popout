/**
 * Automobile Domain - Statistics Model
 *
 * Defines aggregated statistics for automobile vehicle data.
 * Used in statistics panel and charts.
 *
 * Domain: Automobile Discovery
 */

/**
 * Vehicle statistics
 *
 * Aggregated statistics across all filtered vehicles.
 * Provides high-level metrics and distributions for analysis.
 *
 * @example
 * ```typescript
 * const stats: VehicleStatistics = {
 *   totalVehicles: 1247,
 *   totalInstances: 45623,
 *   manufacturerCount: 23,
 *   modelCount: 412,
 *   yearRange: { min: 2010, max: 2024 },
 *   averageInstancesPerVehicle: 36.6,
 *   topManufacturers: [
 *     { name: 'Toyota', count: 234, percentage: 18.8 },
 *     { name: 'Honda', count: 187, percentage: 15.0 }
 *   ]
 * };
 * ```
 */
export class VehicleStatistics {
  /**
   * Total number of unique vehicle configurations
   *
   * Count of distinct manufacturer+model+year+bodyclass combinations.
   * Used for displaying total vehicle count in statistics panel.
   *
   * @example 1247
   */
  totalVehicles!: number;

  /**
   * Total number of VIN instances across all vehicles
   *
   * Sum of all instance_count values. Represents the total number of
   * unique VINs in the filtered dataset.
   *
   * @example 45623
   */
  totalInstances!: number;

  /**
   * Number of unique manufacturers
   *
   * Count of distinct manufacturer names in the filtered dataset.
   *
   * @example 23
   */
  manufacturerCount!: number;

  /**
   * Number of unique models
   *
   * Count of distinct model names (across all manufacturers) in the filtered dataset.
   *
   * @example 412
   */
  modelCount!: number;

  /**
   * Number of unique body classes
   *
   * Count of distinct body class categories (Sedan, SUV, Truck, etc.)
   * in the filtered dataset.
   *
   * @example 8
   */
  bodyClassCount?: number;

  /**
   * Year range (minimum and maximum years in dataset)
   *
   * Object containing min and max year values for the filtered vehicle dataset.
   * Used for year range sliders and charts.
   */
  yearRange!: {
    /**
     * Oldest vehicle year in dataset
     * @example 2010
     */
    min: number;

    /**
     * Newest vehicle year in dataset
     * @example 2024
     */
    max: number;
  };

  /**
   * Average number of VIN instances per vehicle configuration
   *
   * Calculated as totalInstances / totalVehicles. Represents the average
   * number of unique VINs per vehicle spec (manufacturer+model+year+bodyclass).
   *
   * @example 36.6
   */
  averageInstancesPerVehicle!: number;

  /**
   * Median number of VIN instances per vehicle configuration
   *
   * The middle value when all instance counts are sorted. Useful for
   * understanding distribution when outliers exist.
   *
   * @example 28
   */
  medianInstancesPerVehicle?: number;

  /**
   * Top manufacturers by vehicle count (top 20)
   *
   * Array of ManufacturerStat objects sorted by vehicle count in descending order.
   * Typically limited to top 20 manufacturers for chart display.
   * Populated from API response statistics.
   */
  topManufacturers?: ManufacturerStat[];

  /**
   * Top models by instance count (top 20)
   *
   * Array of ModelStat objects sorted by VIN instance count in descending order.
   * Includes both manufacturer name and model name. Limited to top 20 for display.
   */
  topModels?: ModelStat[];

  /**
   * Distribution by body class
   *
   * Array of BodyClassStat objects showing vehicle count and percentage
   * for each body class (Sedan, SUV, Truck, etc.).
   */
  bodyClassDistribution?: BodyClassStat[];

  /**
   * Distribution by year
   *
   * Array of YearStat objects showing vehicle count and percentage for each year.
   * Sorted chronologically from min to max year.
   */
  yearDistribution?: YearStat[];

  /**
   * Distribution by manufacturer
   *
   * Complete list of all manufacturers with vehicle counts and percentages.
   * Similar to topManufacturers but includes all manufacturers, not just top 20.
   */
  manufacturerDistribution?: ManufacturerStat[];

  /**
   * Raw segmented statistics by manufacturer
   *
   * Preserves API's {total, highlighted} structure for each manufacturer.
   * Used for chart highlighting when secondary filters are applied.
   * Format: { "Toyota": { total: 234, highlighted: 45 }, ... }
   */
  byManufacturer?: Record<string, {total: number, highlighted: number}>;

  /**
   * Raw segmented statistics by body class
   *
   * Preserves API's {total, highlighted} structure for each body class.
   * Used for chart highlighting when secondary filters are applied.
   * Format: { "Sedan": { total: 456, highlighted: 78 }, ... }
   */
  byBodyClass?: Record<string, {total: number, highlighted: number}>;

  /**
   * Raw segmented statistics by year range
   *
   * Preserves API's {total, highlighted} structure for each year.
   * Used for chart highlighting when secondary filters are applied.
   * Format: { "2024": { total: 156, highlighted: 32 }, ... }
   */
  byYearRange?: Record<string, {total: number, highlighted: number}>;

  /**
   * Raw segmented statistics by model within each manufacturer
   *
   * Preserves API's nested {total, highlighted} structure for models per manufacturer.
   * Used for detailed model-level chart highlighting.
   * Format: { "Toyota": { "Camry": { total: 45, highlighted: 12 }, ... }, ... }
   */
  modelsByManufacturer?: Record<string, Record<string, {total: number, highlighted: number}>>;

  /**
   * Constructor with partial data
   *
   * Initializes VehicleStatistics instance from partial data using Object.assign.
   * Allows flexible initialization with only properties that need to be set.
   *
   * @param partial - Partial VehicleStatistics object with any subset of properties
   */
  constructor(partial?: Partial<VehicleStatistics>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }

  /**
   * Create VehicleStatistics from API response
   *
   * Handles two formats:
   * 1. Segmented statistics from /vehicles/details (byManufacturer, modelsByManufacturer, etc.)
   * 2. Array-based statistics (top_manufacturers, top_models, etc.)
   *
   * @param data - Raw API response data
   * @returns VehicleStatistics instance
   */
  static fromApiResponse(data: any): VehicleStatistics {
    // Check if this is the segmented statistics format from /vehicles/details
    if (data.byManufacturer || data.modelsByManufacturer || data.byBodyClass || data.byYearRange) {
      return VehicleStatistics.fromSegmentedStats(data);
    }

    // Otherwise use the array-based format
    return new VehicleStatistics({
      totalVehicles: Number(data.total_vehicles || data.totalVehicles || 0),
      totalInstances: Number(data.total_instances || data.totalInstances || 0),
      manufacturerCount: Number(data.manufacturer_count || data.manufacturerCount || 0),
      modelCount: Number(data.model_count || data.modelCount || 0),
      bodyClassCount: data.body_class_count || data.bodyClassCount,
      yearRange: {
        min: Number(data.year_range?.min || data.yearRange?.min || 0),
        max: Number(data.year_range?.max || data.yearRange?.max || 0)
      },
      averageInstancesPerVehicle: Number(
        data.average_instances_per_vehicle ||
        data.averageInstancesPerVehicle ||
        0
      ),
      medianInstancesPerVehicle: data.median_instances_per_vehicle ||
        data.medianInstancesPerVehicle,
      topManufacturers: data.top_manufacturers?.map((m: any) =>
        ManufacturerStat.fromApiResponse(m)
      ) || data.topManufacturers?.map((m: any) =>
        ManufacturerStat.fromApiResponse(m)
      ),
      topModels: data.top_models?.map((m: any) =>
        ModelStat.fromApiResponse(m)
      ) || data.topModels?.map((m: any) =>
        ModelStat.fromApiResponse(m)
      ),
      bodyClassDistribution: data.body_class_distribution?.map((b: any) =>
        BodyClassStat.fromApiResponse(b)
      ) || data.bodyClassDistribution?.map((b: any) =>
        BodyClassStat.fromApiResponse(b)
      ),
      yearDistribution: data.year_distribution?.map((y: any) =>
        YearStat.fromApiResponse(y)
      ) || data.yearDistribution?.map((y: any) =>
        YearStat.fromApiResponse(y)
      ),
      manufacturerDistribution: data.manufacturer_distribution?.map((m: any) =>
        ManufacturerStat.fromApiResponse(m)
      ) || data.manufacturerDistribution?.map((m: any) =>
        ManufacturerStat.fromApiResponse(m)
      )
    });
  }

  /**
   * Create VehicleStatistics from segmented API statistics
   *
   * Transforms the /vehicles/details statistics format:
   * { byManufacturer: { Ford: { total, highlighted } }, ... }
   *
   * @param data - Segmented statistics data
   * @returns VehicleStatistics instance
   */
  private static fromSegmentedStats(data: any): VehicleStatistics {
    // Transform API's segmented statistics structure to arrays
    const topManufacturers = VehicleStatistics.transformByManufacturer(data.byManufacturer);
    const topModels = VehicleStatistics.transformModelsByManufacturer(data.modelsByManufacturer);
    const bodyClassDistribution = VehicleStatistics.transformByBodyClass(data.byBodyClass);
    const yearDistribution = VehicleStatistics.transformByYearRange(data.byYearRange);

    // Calculate totals
    const totalVehicles = data.totalCount || 0;
    const manufacturerCount = topManufacturers?.length || 0;
    const modelCount = topModels?.length || 0;
    const bodyClassCount = bodyClassDistribution?.length || 0;

    // Calculate year range from yearDistribution
    const years = yearDistribution?.map(y => y.year) || [];
    const yearRange = years.length > 0
      ? { min: Math.min(...years), max: Math.max(...years) }
      : { min: 0, max: 0 };

    return new VehicleStatistics({
      totalVehicles,
      totalInstances: totalVehicles,
      manufacturerCount,
      modelCount,
      bodyClassCount,
      yearRange,
      averageInstancesPerVehicle: 0,
      topManufacturers,
      topModels,
      bodyClassDistribution,
      yearDistribution,
      manufacturerDistribution: topManufacturers,
      // Preserve raw segmented statistics for chart highlighting
      byManufacturer: data.byManufacturer,
      byBodyClass: data.byBodyClass,
      byYearRange: data.byYearRange,
      modelsByManufacturer: data.modelsByManufacturer
    });
  }

  /**
   * Transform API's byManufacturer object to ManufacturerStat array
   */
  private static transformByManufacturer(byManufacturer: Record<string, any> | undefined): ManufacturerStat[] | undefined {
    if (!byManufacturer) return undefined;

    const stats = Object.entries(byManufacturer).map(([name, countOrStats]) => {
      // Handle both formats: simple number or {total, highlighted}
      const count = typeof countOrStats === 'object' ? (countOrStats.total || 0) : (countOrStats || 0);

      return new ManufacturerStat({
        name,
        count,
        instanceCount: count,
        percentage: 0,
        modelCount: 0
      });
    });

    // Sort by count descending
    stats.sort((a, b) => b.count - a.count);

    // Calculate percentages
    const totalCount = stats.reduce((sum, s) => sum + s.count, 0);
    stats.forEach(s => {
      s.percentage = totalCount > 0 ? (s.count / totalCount) * 100 : 0;
    });

    return stats.slice(0, 20);
  }

  /**
   * Transform API's modelsByManufacturer object to ModelStat array
   */
  private static transformModelsByManufacturer(modelsByManufacturer: Record<string, Record<string, any>> | undefined): ModelStat[] | undefined {
    if (!modelsByManufacturer) return undefined;

    const stats: ModelStat[] = [];
    let totalCount = 0;

    Object.entries(modelsByManufacturer).forEach(([manufacturer, models]) => {
      Object.entries(models).forEach(([modelName, countOrStats]) => {
        // Handle both formats: simple number or {total, highlighted}
        const instanceCount = typeof countOrStats === 'object' ? (countOrStats.total || 0) : (countOrStats || 0);
        totalCount += instanceCount;
        stats.push(new ModelStat({
          name: modelName,
          manufacturer,
          count: 1,
          instanceCount,
          percentage: 0
        }));
      });
    });

    // Sort by instance count descending
    stats.sort((a, b) => b.instanceCount - a.instanceCount);

    // Calculate percentages
    stats.forEach(s => {
      s.percentage = totalCount > 0 ? (s.instanceCount / totalCount) * 100 : 0;
    });

    return stats.slice(0, 20);
  }

  /**
   * Transform API's byBodyClass object to BodyClassStat array
   */
  private static transformByBodyClass(byBodyClass: Record<string, any> | undefined): BodyClassStat[] | undefined {
    if (!byBodyClass) return undefined;

    const stats = Object.entries(byBodyClass).map(([name, countOrStats]) => {
      // Handle both formats: simple number or {total, highlighted}
      const count = typeof countOrStats === 'object' ? (countOrStats.total || 0) : (countOrStats || 0);

      return new BodyClassStat({
        name,
        count,
        instanceCount: count,
        percentage: 0
      });
    });

    // Calculate percentages
    const totalCount = stats.reduce((sum, s) => sum + s.count, 0);
    stats.forEach(s => {
      s.percentage = totalCount > 0 ? (s.count / totalCount) * 100 : 0;
    });

    // Sort by count descending
    stats.sort((a, b) => b.count - a.count);

    return stats;
  }

  /**
   * Transform API's byYearRange object to YearStat array
   */
  private static transformByYearRange(byYearRange: Record<string, any> | undefined): YearStat[] | undefined {
    if (!byYearRange) return undefined;

    const stats = Object.entries(byYearRange).map(([yearStr, countOrStats]) => {
      // Handle both formats: simple number or {total, highlighted}
      const count = typeof countOrStats === 'object' ? (countOrStats.total || 0) : (countOrStats || 0);

      return new YearStat({
        year: parseInt(yearStr, 10),
        count,
        instanceCount: count,
        percentage: 0
      });
    });

    // Calculate percentages
    const totalCount = stats.reduce((sum, s) => sum + s.count, 0);
    stats.forEach(s => {
      s.percentage = totalCount > 0 ? (s.count / totalCount) * 100 : 0;
    });

    // Sort by year ascending
    stats.sort((a, b) => a.year - b.year);

    return stats;
  }

  /**
   * Get year span (number of years covered)
   *
   * @returns Number of years from min to max
   */
  getYearSpan(): number {
    return this.yearRange.max - this.yearRange.min + 1;
  }

  /**
   * Get average vehicles per manufacturer
   *
   * @returns Average count
   */
  getAverageVehiclesPerManufacturer(): number {
    return this.manufacturerCount > 0
      ? this.totalVehicles / this.manufacturerCount
      : 0;
  }

  /**
   * Get average models per manufacturer
   *
   * @returns Average count
   */
  getAverageModelsPerManufacturer(): number {
    return this.manufacturerCount > 0
      ? this.modelCount / this.manufacturerCount
      : 0;
  }
}

/**
 * Manufacturer statistic
 *
 * Aggregated data for a single manufacturer, including vehicle count,
 * VIN instances, percentage distribution, and model count.
 */
export class ManufacturerStat {
  /**
   * Manufacturer name
   *
   * The name of the automobile manufacturer (e.g., Toyota, Honda, Ford).
   * Used for display in charts and tables.
   *
   * @example 'Toyota'
   */
  name!: string;

  /**
   * Number of vehicle configurations for this manufacturer
   *
   * Count of distinct vehicle specs (model+year+bodyclass combinations)
   * from this manufacturer in the filtered dataset.
   *
   * @example 234
   */
  count!: number;

  /**
   * Total VIN instances for this manufacturer
   *
   * Sum of all unique VINs across all vehicle configurations from this manufacturer.
   * Provides a measure of prevalence in the dataset.
   *
   * @example 8456
   */
  instanceCount?: number;

  /**
   * Percentage of total vehicles
   *
   * The percentage that this manufacturer's vehicle count represents
   * of the total vehicle count in the filtered dataset. Used for pie/bar charts.
   *
   * @example 18.8
   */
  percentage!: number;

  /**
   * Number of unique models for this manufacturer
   *
   * Count of distinct model names produced by this manufacturer
   * in the filtered dataset.
   *
   * @example 42
   */
  modelCount?: number;

  /**
   * Constructor with partial data
   *
   * Initializes ManufacturerStat instance from partial data using Object.assign.
   * Allows flexible initialization with only properties that need to be set.
   *
   * @param partial - Partial ManufacturerStat object with any subset of properties
   */
  constructor(partial?: Partial<ManufacturerStat>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }

  /**
   * Create ManufacturerStat from API response
   *
   * Transforms raw API data to ManufacturerStat instance.
   * Handles both snake_case and camelCase field names from different API versions.
   *
   * @param data - Raw API response data for a single manufacturer
   * @returns ManufacturerStat instance with normalized properties
   */
  static fromApiResponse(data: any): ManufacturerStat {
    return new ManufacturerStat({
      name: data.name || data.manufacturer,
      count: Number(data.count || data.vehicle_count || 0),
      instanceCount: data.instance_count || data.instanceCount,
      percentage: Number(data.percentage || 0),
      modelCount: data.model_count || data.modelCount
    });
  }
}

/**
 * Model statistic
 *
 * Aggregated data for a single model across all manufacturers and years.
 * Includes vehicle count, VIN instances, and percentage distribution.
 */
export class ModelStat {
  /**
   * Model name
   *
   * The name of the vehicle model (e.g., Camry, Accord, F-150).
   * Note: Same model names can appear from different manufacturers.
   *
   * @example 'Camry'
   */
  name!: string;

  /**
   * Manufacturer name
   *
   * The manufacturer of this model. Combined with name provides unique model identification.
   *
   * @example 'Toyota'
   */
  manufacturer!: string;

  /**
   * Number of vehicle configurations for this model
   *
   * Count of distinct vehicle specs (year+bodyclass combinations) for this
   * manufacturer+model combination in the filtered dataset.
   *
   * @example 15
   */
  count!: number;

  /**
   * Total VIN instances for this model
   *
   * Sum of all unique VINs across all configurations of this manufacturer+model.
   * Higher counts indicate more prevalent models in the dataset.
   *
   * @example 3456
   */
  instanceCount!: number;

  /**
   * Percentage of total instances
   *
   * The percentage that this model's VIN count represents of the total VINs
   * in the filtered dataset. Used for sorting and chart display.
   *
   * @example 7.6
   */
  percentage!: number;

  /**
   * Constructor with partial data
   *
   * Initializes ModelStat instance from partial data using Object.assign.
   * Allows flexible initialization with only properties that need to be set.
   *
   * @param partial - Partial ModelStat object with any subset of properties
   */
  constructor(partial?: Partial<ModelStat>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }

  /**
   * Create ModelStat from API response
   *
   * Transforms raw API data to ModelStat instance.
   * Handles both snake_case and camelCase field names from different API versions.
   *
   * @param data - Raw API response data for a single model
   * @returns ModelStat instance with normalized properties
   */
  static fromApiResponse(data: any): ModelStat {
    return new ModelStat({
      name: data.name || data.model,
      manufacturer: data.manufacturer,
      count: Number(data.count || data.vehicle_count || 0),
      instanceCount: Number(data.instance_count || data.instanceCount || 0),
      percentage: Number(data.percentage || 0)
    });
  }

  /**
   * Get full model name including manufacturer
   *
   * Concatenates manufacturer and model name with space separator
   * for display in charts and UI elements.
   *
   * @returns Full model name (e.g., "Toyota Camry")
   */
  getFullName(): string {
    return `${this.manufacturer} ${this.name}`;
  }
}

/**
 * Body class statistic
 *
 * Aggregated data for a single body class (Sedan, SUV, Truck, etc.).
 * Includes vehicle count, VIN instances, and percentage distribution.
 */
export class BodyClassStat {
  /**
   * Body class name
   *
   * The vehicle body class category (e.g., Sedan, SUV, Truck, Convertible, Wagon).
   * Used for categorizing and filtering vehicles in the dataset.
   *
   * @example 'Sedan'
   */
  name!: string;

  /**
   * Number of vehicle configurations for this body class
   *
   * Count of distinct vehicle specs (manufacturer+model+year combinations)
   * that match this body class in the filtered dataset.
   *
   * @example 456
   */
  count!: number;

  /**
   * Total VIN instances for this body class
   *
   * Sum of all unique VINs across all configurations in this body class.
   * Indicates the prevalence of this body class in the dataset.
   *
   * @example 16789
   */
  instanceCount?: number;

  /**
   * Percentage of total vehicles
   *
   * The percentage that this body class's vehicle count represents of the total
   * vehicle count in the filtered dataset. Used for pie/bar chart display.
   *
   * @example 36.6
   */
  percentage!: number;

  /**
   * Constructor with partial data
   *
   * Initializes BodyClassStat instance from partial data using Object.assign.
   * Allows flexible initialization with only properties that need to be set.
   *
   * @param partial - Partial BodyClassStat object with any subset of properties
   */
  constructor(partial?: Partial<BodyClassStat>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }

  /**
   * Create BodyClassStat from API response
   *
   * Transforms raw API data to BodyClassStat instance.
   * Handles multiple field naming conventions from different API versions.
   *
   * @param data - Raw API response data for a single body class
   * @returns BodyClassStat instance with normalized properties
   */
  static fromApiResponse(data: any): BodyClassStat {
    return new BodyClassStat({
      name: data.name || data.body_class || data.bodyClass,
      count: Number(data.count || data.vehicle_count || 0),
      instanceCount: data.instance_count || data.instanceCount,
      percentage: Number(data.percentage || 0)
    });
  }
}

/**
 * Year statistic
 *
 * Aggregated data for a single vehicle year. Includes vehicle count,
 * VIN instances, percentage distribution, and utility methods for age calculation.
 */
export class YearStat {
  /**
   * Vehicle year
   *
   * The model year of vehicles in this statistic (e.g., 2024, 2010).
   * Used for chronological filtering and analysis.
   *
   * @example 2024
   */
  year!: number;

  /**
   * Number of vehicle configurations for this year
   *
   * Count of distinct vehicle specs (manufacturer+model+bodyclass combinations)
   * from this year in the filtered dataset.
   *
   * @example 89
   */
  count!: number;

  /**
   * Total VIN instances for this year
   *
   * Sum of all unique VINs across all vehicle configurations from this year.
   * Indicates how many vehicles from this year are in the dataset.
   *
   * @example 3245
   */
  instanceCount?: number;

  /**
   * Percentage of total vehicles
   *
   * The percentage that this year's vehicle count represents of the total
   * vehicle count in the filtered dataset. Used for chart display.
   *
   * @example 7.1
   */
  percentage!: number;

  /**
   * Constructor with partial data
   *
   * Initializes YearStat instance from partial data using Object.assign.
   * Allows flexible initialization with only properties that need to be set.
   *
   * @param partial - Partial YearStat object with any subset of properties
   */
  constructor(partial?: Partial<YearStat>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }

  /**
   * Create YearStat from API response
   *
   * Transforms raw API data to YearStat instance.
   * Handles both snake_case and camelCase field names from different API versions.
   *
   * @param data - Raw API response data for a single year
   * @returns YearStat instance with normalized properties
   */
  static fromApiResponse(data: any): YearStat {
    return new YearStat({
      year: Number(data.year),
      count: Number(data.count || data.vehicle_count || 0),
      instanceCount: data.instance_count || data.instanceCount,
      percentage: Number(data.percentage || 0)
    });
  }

  /**
   * Check if this year is the current year
   *
   * Compares the year value against the current calendar year.
   * Useful for highlighting recent vehicles or marking newest models.
   *
   * @returns True if year equals current year, false otherwise
   */
  isCurrentYear(): boolean {
    return this.year === new Date().getFullYear();
  }

  /**
   * Get age of vehicles from this year
   *
   * Calculates the number of years from this year to the current year.
   * Represents how old vehicles from this model year are.
   *
   * @returns Number of years from this year to current year (can be 0 for current year)
   */
  getAge(): number {
    return new Date().getFullYear() - this.year;
  }
}
