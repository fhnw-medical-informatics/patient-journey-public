import { createPatientData, PatientData } from './patients'
import { createEventData, EventData } from './events'
import * as csvParser from 'papaparse'
import { Alert } from '../alert/alertSlice'

export type LoadingProgress = { activeStep: LoadingStep }

export enum LoadingStep {
  Patients,
  Events,
}

export const DATA_LOADING_ERROR = 'Data Loading Error'
export const DATA_LOADING_WARNING = 'Data Loading Warning'

const HEADER_ROW_COUNT = 2

export interface LoadedData {
  readonly patientData: PatientData
  readonly eventData: EventData
}

export const loadData = async (
  patientDataUrl: string,
  eventDataUrl: string,
  onLoadingDataInProgress: (progress: LoadingProgress) => void,
  onLoadingDataComplete: (data: LoadedData) => void,
  onLoadingDataFailed: (message: string) => void,
  onAddAlerts: (alerts: ReadonlyArray<Alert>) => void,
) => {
  const onWarning = (message: string) => onAddAlerts([{ type: 'warning', topic: DATA_LOADING_WARNING, message }])
  const onError = (message: string) => onAddAlerts([{ type: 'error', topic: DATA_LOADING_ERROR, message }])
  try {
    // loading patients
    onLoadingDataInProgress({ activeStep: LoadingStep.Patients })
    const patientData = createPatientData(
      await parseEntityDataFromUrl(patientDataUrl, 'Patient'),
      HEADER_ROW_COUNT,
      onWarning,
    )

    // loading events
    onLoadingDataInProgress({ activeStep: LoadingStep.Events })
    const eventData = createEventData(await parseEntityDataFromUrl(eventDataUrl, 'Event'), HEADER_ROW_COUNT, onWarning)

    // loading complete
    const data = { patientData, eventData }
    onLoadingDataComplete(data)
  } catch (e: any) {
    console.error(DATA_LOADING_ERROR, e)
    onLoadingDataFailed(DATA_LOADING_ERROR)
    onError(e.message)
  }
}

async function parseDataFromUrl(url: string) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`${response.statusText} (${response.url})`)
  }
  const csv = await response.text()
  const result = parseFromString(csv)
  if (result.errors.length > 0) {
    throw new Error('Parsing errors: ' + result.errors.join('\n'))
  } else {
    return result
  }
}

async function parseEntityDataFromUrl(url: string, entityName: string) {
  const result = await parseDataFromUrl(url)
  if (result.data.length < HEADER_ROW_COUNT) {
    throw new Error(`${entityName} data table must contain two header rows (column names, column types).`)
  } else if (result.data.length === HEADER_ROW_COUNT) {
    throw new Error(`${entityName} data table must contain at least one row of data.`)
  } else {
    return result.data
  }
}

export const parseFromString = (csv: string) => {
  // use header = false to get string[][] rather than JSON -> extracting header fields ourselves
  return csvParser.parse<string[]>(csv, { header: false, skipEmptyLines: true, delimiter: ',' })
}
