import os
import logging

from jinja2 import Environment, BaseLoader

from db.data_dir_contents import PATIENT_REPORTS_TXT, PATIENTS_CSV
from db.shared import LoadedDataFrames

logger = logging.getLogger(__name__)

# This script reads patient and event data from CSV files and writes patient journey reports to a text file
# based on a Jinja2 template.
def prepare_patient_journeys(data_frames: LoadedDataFrames):
    patients_df = data_frames['patients']
    events_df = data_frames['events']

    # Jinja2 template for patient journeys
    template_source = """
    Patient information:
    {% for key, value in patient.items() %}
    {{ key }}: {{ value }}
    {% endfor %}

    The patients' journey through the hospital:
    {% for event in events %}
    Event {{ loop.index }}:
    {% for key, value in event.items() %}
    {{ key }}: {{ value }}
    {% endfor %}
    {% endfor %}
    """

    # Prepare the Jinja2 template
    env = Environment(loader=BaseLoader())
    template = env.from_string(template_source.strip())

    # Prepare and write patient journeys to a text file
    with open(PATIENT_REPORTS_TXT, 'w') as file:
        for index, patient in patients_df.iterrows():
            patient_id = patient['Patient ID']
            patient_events = events_df[events_df['Patient ID'] == patient_id].to_dict(orient='records')

            # Creating the context
            context = {
                'patient': patient.to_dict(),
                'events': patient_events,
            }

            # Rendering the template
            journey_text = template.render(context).replace('\n', ' ').strip()

            # Write to file
            file.write(f'{patient_id} {journey_text}\n')

    logger.info(f"Patient journey reports have been written to {PATIENT_REPORTS_TXT}")


# Check if the patient journey reports have already been prepared and are plausible
def init_patient_journeys(data_frames: LoadedDataFrames):

    # Check if the reports file exists
    if os.path.exists(PATIENT_REPORTS_TXT):
        try:
            # Read the first patient ID from the patients CSV to check against the report
            with open(PATIENTS_CSV, 'r') as patients_file:
                # Skip the header and the first row
                next(patients_file)
                column_header_types = next(patients_file).split(",")
                pid_column_index = column_header_types.index('pid')
                # Get the first patient ID
                first_patient_id = next(patients_file).split(',')[pid_column_index]

            # Read the first line of the patient reports to check for plausibility
            with open(PATIENT_REPORTS_TXT, 'r') as reports_file:
                first_line = reports_file.readline()
                if not first_line.startswith(first_patient_id):
                    raise ValueError(f"The patient reports file does not contain valid data. Expected the first line to start with: {first_patient_id}")

            # Check if the number of lines in the patient reports matches the number of patients
            with open(PATIENTS_CSV, 'r') as patients_file:
                # Subtract 2 for the header and the column types row
                num_patients = sum(1 for _ in patients_file) - 2

            with open(PATIENT_REPORTS_TXT, 'r') as reports_file:
                num_reports = sum(1 for _ in reports_file)

            if num_patients != num_reports:
                raise ValueError("The number of patient reports does not match the number of patients")

            logger.info("Patient journey reports already exist and seem plausible")

        except Exception as e:
            logger.error(f"An error occurred while checking the patient reports: {e}")
            raise e
    else:
        prepare_patient_journeys(data_frames)
