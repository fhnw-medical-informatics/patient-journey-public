import React, { useCallback, useMemo } from 'react'
import { BarDatum, BarTooltipProps, ComputedDatum, ResponsiveBarCanvas } from '@nivo/bar'
import { barColors, DataDiagramsProps, greyColor } from './shared'
import { makeStyles } from '../../../utils'
import { useTheme } from '@mui/material'
import { useCategories } from './hooks'
import Tooltip from './Tooltip'
import { FilterColumn } from '../../filtering'

import CategoryCountsWorker from '../../workers/create-category-counts?worker'
import { CategoryCountsWorkerData, CategoryCountsWorkerResponse } from '../../workers/create-category-counts'
import { useWorker } from '../../workers/hooks'

const useStyles = makeStyles()(() => ({
  container: {
    width: '100%',
    height: '100px',
  },
}))

interface BinDatum {
  readonly binIndex: number
  readonly category: string
  readonly filteredIn: number
  readonly filteredOut: number
}

export type CategoryDiagramProps = DataDiagramsProps<'category'>

export const CategoryDataDiagram = ({
  allActiveData,
  filteredActiveData,
  column,
  onDataClick,
  colorByColumn,
  colorByCategoryFn,
}: CategoryDiagramProps) => {
  const { classes } = useStyles()
  const theme = useTheme()

  const colors = useCallback(
    (node: any) => {
      if (node.id === 'filteredOut') {
        return greyColor(theme)
      } else {
        return colorByCategoryFn(node?.data?.category.valueOf())
      }
    },
    [colorByCategoryFn, theme],
  )

  const { allCategories, uniqueCategories, extractValueSafe } = useCategories(allActiveData, column)

  const filteredCategories = useMemo(
    () => filteredActiveData.flatMap(extractValueSafe),
    [filteredActiveData, extractValueSafe],
  )

  const allCategoriesWorkerData = useMemo(
    () => ({ categories: allCategories, uniqueCategories }),
    [allCategories, uniqueCategories],
  )

  const allCategoryCount = useWorker<CategoryCountsWorkerData, CategoryCountsWorkerResponse>(
    CategoryCountsWorker,
    allCategoriesWorkerData,
    new Map(),
  )

  const filteredCategoriesWorkerData = useMemo(
    () => ({ categories: filteredCategories, uniqueCategories }),
    [filteredCategories, uniqueCategories],
  )

  const filteredCategoryCount = useWorker<CategoryCountsWorkerData, CategoryCountsWorkerResponse>(
    CategoryCountsWorker,
    filteredCategoriesWorkerData,
    new Map(),
  )

  const data = useMemo(() => {
    return uniqueCategories.map<BinDatum>((category: string, binIndex: number) => {
      const allCount = allCategoryCount.get(category) ?? 0
      const filteredCount = filteredCategoryCount.get(category) ?? 0
      const filteredIn = filteredCount
      const filteredOut = allCount - filteredCount
      return {
        binIndex,
        filteredIn,
        filteredOut,
        category,
      }
    })
  }, [filteredCategoryCount, uniqueCategories, allCategoryCount])

  const tooltip = useCallback<React.FC<BarTooltipProps<any>>>(
    ({ data, value, color, index }) => {
      const title = `${data.category} (${value})`
      return <Tooltip text={title} color={color} index={index} total={uniqueCategories.length - 1} />
    },
    [uniqueCategories.length],
  )

  const handleBinClick = useCallback(
    (bin: ComputedDatum<any>) => {
      onDataClick({
        column,
        type: column.type,
        value: {
          categories: [bin.data.category],
        },
      })
    },
    [column, onDataClick],
  )

  return (
    <div className={classes.container}>
      <ResponsiveBarCanvas
        data={data as unknown as BarDatum[]}
        indexBy={'binIndex'}
        keys={['filteredIn', 'filteredOut']}
        groupMode={'stacked'}
        colors={
          colorByColumn.type !== 'none' && column.name === (colorByColumn.column as FilterColumn).name
            ? colors
            : barColors(theme)
        }
        tooltip={tooltip}
        enableLabel={false}
        enableGridY={false}
        onClick={handleBinClick}
        layers={['bars']}
      />
    </div>
  )
}
