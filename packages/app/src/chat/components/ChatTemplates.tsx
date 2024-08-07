import React from 'react'

import { Chip, Stack, Typography } from '@mui/material'

const PromptTemplates = [
  {
    label: 'Help',
    prompt: 'Hi, I am new to this app. What can you assist me with?',
  },
  {
    label: 'Overview',
    prompt: 'Give me an overview of the dataset.',
  },
  {
    label: 'Meta',
    prompt: 'What is the longest patient journey in the dataset?',
  },
  {
    label: 'Highlight',
    prompt: 'Highlight patients with psychiatric conditions.',
  },
  {
    label: 'Find',
    prompt: 'Are there any patients with psychiatric conditions?',
  },
  {
    label: 'Find Similar',
    prompt: 'I am looking for patient journeys similar to this one: A patient that has undergone eye surgery.',
  },
  {
    label: 'Similarity',
    prompt: 'Why are these patients similar? List and interpret the 3 key-factors (max. 1 sentence each).',
  },
  {
    label: 'Difference',
    prompt:
      'These patient journeys belong to different clusters. Why are these patients different? List the 3 key differentiating factors (max. 1 sentence each).',
  },
  {
    label: 'Describe Cluster',
    prompt: `These patients are in the same cluster with close proximity to each other (on a 2D plot created via dimensionality reduction).
  
Based on their patient journeys, please write a text that would describe their cluster (don't describe the patient journeys, just use them to create a cluster title and description with max 3 sentences, nicely formatted).`,
  },
  {
    label: 'Analyze Journey',
    prompt: `Please analyze this patient journey and tell me in simple words, what this patient has gone through. Try to interpret the data you have and make assumptions. Be short and concise.`,
  },
]

interface Props {
  onTemplateClick: (template: string) => void
  disabled?: boolean
}

export const ChatTemplates = ({ onTemplateClick, disabled = false }: Props) => {
  return (
    <>
      {/* Use the material ui Chip component to list the templates, a click should set the template prompt */}
      <Stack direction="column" gap={1}>
        <Typography variant="caption" sx={{ margin: 0, padding: 0 }}>
          Templates
        </Typography>
        <Stack direction="row" gap={1} flexWrap={'wrap'}>
          {PromptTemplates.map((template, index) => (
            <Chip
              key={index}
              variant="filled"
              onClick={() => onTemplateClick(template.prompt)}
              disabled={disabled}
              size="small"
              label={template.label}
            />
          ))}
        </Stack>
      </Stack>
    </>
  )
}
