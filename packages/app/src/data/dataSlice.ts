import { createSlice, Draft, freeze, PayloadAction } from '@reduxjs/toolkit'
import { Dispatch } from 'redux'

import { GenericFilter } from './filtering'
import { EntityId, EntityIdNone, EntityType } from './entities'
import { loadData as loadDataImpl, LoadedData, LoadingProgress } from './loading'
import { EVENT_DATA_FILE_URL, PATIENT_DATA_FILE_URL } from './constants'
import { addAlerts } from '../alert/alertSlice'
import { PatientId, PatientIdNone } from './patients'

import {
  DataLoadingComplete,
  DataLoadingFailed,
  DataLoadingInProgress,
  DataLoadingPending,
} from '../utils/loadingTypes'

type DataStateLoadingPending = DataLoadingPending

type DataStateLoadingInProgress = DataLoadingInProgress & LoadingProgress

export type DataStateLoadingFailed = DataLoadingFailed

export type DataStateLoadingComplete = DataLoadingComplete<
  LoadedData & ActiveDataView & Filters & Hovering & Selection & IndexPatient & SplitPane & Cohort
>

export const ACTIVE_DATA_VIEWS = ['patients', 'events'] as const
export type ActiveDataViewType = (typeof ACTIVE_DATA_VIEWS)[number]

interface ActiveDataView {
  readonly view: ActiveDataViewType
}

interface Filters {
  readonly filters: ReadonlyArray<GenericFilter>
}

export interface FocusEntity {
  readonly type: EntityType | 'none'
  readonly uid: EntityId
}

const FOCUS_ENTITY_NONE: FocusEntity = { type: 'none', uid: EntityIdNone }

interface Hovering {
  readonly hovered: FocusEntity
}

interface Selection {
  readonly selected: FocusEntity
}

interface Cohort {
  readonly cohortPatientIds: ReadonlyArray<PatientId>
}

interface IndexPatient {
  readonly indexPatientId: PatientId
}

interface SplitPane {
  isResizing: boolean
}

export type DataState =
  | DataStateLoadingPending
  | DataStateLoadingInProgress
  | DataStateLoadingFailed
  | DataStateLoadingComplete

const dataSlice = createSlice({
  name: 'data',
  initialState: { type: 'loading-pending' } as DataState,
  reducers: {
    loadingDataInProgress: (_state: DataState, action: PayloadAction<LoadingProgress>): DataState => ({
      type: 'loading-in-progress',
      ...action.payload,
    }),
    loadingDataFailed: (_state: DataState, action: PayloadAction<string>): DataState => ({
      type: 'loading-failed',
      errorMessage: action.payload,
    }),
    loadingDataComplete: (_state: DataState, action: PayloadAction<LoadedData>): DataState => ({
      type: 'loading-complete',
      filters: [],
      view: 'patients',
      hovered: FOCUS_ENTITY_NONE,
      selected: FOCUS_ENTITY_NONE,
      indexPatientId: PatientIdNone,
      isResizing: false,
      cohortPatientIds: [],
      ...freeze(action.payload, true),
    }),
    setHoveredEntity: (state: Draft<DataState>, action: PayloadAction<FocusEntity>) => {
      mutateLoadedDataState(state, (s) => {
        s.hovered = action.payload.uid === EntityIdNone ? FOCUS_ENTITY_NONE : action.payload
      })
    },
    setSelectedEntity: (state: Draft<DataState>, action: PayloadAction<FocusEntity>) => {
      mutateLoadedDataState(state, (s) => {
        if (s.selected.uid === action.payload.uid && s.selected.type === action.payload.type) {
          s.selected = FOCUS_ENTITY_NONE
        } else {
          s.selected = action.payload.uid === EntityIdNone ? FOCUS_ENTITY_NONE : action.payload
        }
      })
    },
    addDataFilter: (state: Draft<DataState>, action: PayloadAction<GenericFilter>) => {
      mutateFilterData(state, (data) => {
        const existingFilterIndex = data.findIndex((filter) => filter.column.name === action.payload.column.name)

        if (existingFilterIndex !== -1) {
          data[existingFilterIndex] = action.payload
        } else {
          data.push(action.payload)
        }
      })
    },
    removeDataFilter: (state: Draft<DataState>, action: PayloadAction<GenericFilter>) => {
      mutateFilterData(state, (data) => {
        const existingFilterIndex = data.findIndex((filter) => filter.column.name === action.payload.column.name)

        if (existingFilterIndex !== -1) {
          data.splice(existingFilterIndex, 1)
        }
      })
    },
    resetDataFilter: (state: Draft<DataState>) => ({
      ...state,
      filters: [],
    }),
    setDataView: (state: Draft<DataState>, action: PayloadAction<ActiveDataViewType>) => {
      mutateLoadedDataState(state, (data) => {
        data.view = action.payload
      })
    },
    setIndexPatient: (state: Draft<DataState>, action: PayloadAction<string>) => {
      mutateLoadedDataState(state, (s) => {
        s.indexPatientId = action.payload as PatientId
      })
    },
    resetIndexPatient: (state: Draft<DataState>) => {
      mutateLoadedDataState(state, (s) => {
        s.indexPatientId = PatientIdNone
      })
    },
    setSplitPaneResizing: (state: Draft<DataState>, action: PayloadAction<SplitPane>) => {
      mutateLoadedDataState(state, (s) => {
        s.isResizing = action.payload.isResizing
      })
    },
    addToCohort: (state: Draft<DataState>, action: PayloadAction<ReadonlySet<PatientId>>) => {
      mutateLoadedDataState(state, (s) => {
        s.cohortPatientIds = [...new Set([...s.cohortPatientIds, ...action.payload])]
      })
    },
    removeFromCohort: (state: Draft<DataState>, action: PayloadAction<ReadonlySet<PatientId>>) => {
      mutateLoadedDataState(state, (s) => {
        s.cohortPatientIds = s.cohortPatientIds.filter((id) => !action.payload.has(id))
      })
    },
    clearCohort: (state: Draft<DataState>) => {
      mutateLoadedDataState(state, (s) => {
        s.cohortPatientIds = []
      })
    },
  },
})

const mutateLoadedDataState = (
  state: Draft<DataState>,
  applyMutation: (data: Draft<DataStateLoadingComplete>) => void,
) => {
  if (state.type === 'loading-complete') {
    applyMutation(state)
  }
}

const mutateFilterData = (
  state: Draft<DataState>,
  applyMutation: (data: Draft<ReadonlyArray<GenericFilter>>) => void,
) => {
  if (state.type === 'loading-complete') {
    applyMutation(state.filters)
  }
}

export const dataReducer = dataSlice.reducer
export const {
  loadingDataInProgress,
  loadingDataFailed,
  loadingDataComplete,
  setSelectedEntity,
  setHoveredEntity,
  addDataFilter,
  removeDataFilter,
  resetDataFilter,
  setDataView,
  setIndexPatient,
  resetIndexPatient,
  setSplitPaneResizing,
  addToCohort,
  removeFromCohort,
  clearCohort,
} = dataSlice.actions

/** Decouples redux action dispatch from loading implementation to avoid circular dependencies */
export const loadData =
  (patientDataUrl: string = PATIENT_DATA_FILE_URL, eventDataUrl: string = EVENT_DATA_FILE_URL) =>
  async (dispatch: Dispatch) => {
    return await loadDataImpl(
      patientDataUrl,
      eventDataUrl,
      (progress: LoadingProgress) => dispatch(loadingDataInProgress(progress)),
      (data) => dispatch(loadingDataComplete(data)),
      (message) => dispatch(loadingDataFailed(message)),
      (alerts) => dispatch(addAlerts(alerts)),
    )
  }
