import logging

import numpy as np
import pandas as pd
import umap as umap_lib
from langchain_community.vectorstores import Chroma
from sklearn.cluster import KMeans

from db.shared import COORDINATES_AND_CLUSTER_COLUMN_NAMES

logger = logging.getLogger(__name__)

CLUSTER_COUNT = 6
RANDOM_STATE = 99
TARGET_N_DIMENSIONS = 2
UMAP_N_NEIGHBORS = 9
UMAP_MIN_DIST = 0.011
UMAP_METRIC = 'cosine'


def calc_2d_and_clusters(db: Chroma) -> pd.DataFrame:
    logger.info("Dimensionality Reduction & Clustering")

    entries = db.get(include=['embeddings', 'documents'])
    ids, embeddings = entries['ids'], entries['embeddings']
    coordinates = reduce_dimensionality(embeddings)
    clusters = create_clusters(coordinates)
    coordinates_and_clusters = []
    for index, id in enumerate(ids):
        coordinates_and_clusters.append(
            [id, float(coordinates[index][0]), float(coordinates[index][1]), int(clusters[index])])

    # Read into a neatly named data frame
    df = pd.DataFrame(coordinates_and_clusters)
    df = df.drop(df.columns[0], axis=1)
    df.columns = COORDINATES_AND_CLUSTER_COLUMN_NAMES

    return df


def reduce_dimensionality(embeddings: list[list[float]]):
    logger.info("  -> Reducing dimensions via UMAP...")
    embeddings = np.array(embeddings)
    n_samples = embeddings.shape[0]  # Number of samples

    if n_samples < 2:
        raise ValueError('Number of samples must be greater than 1')

    umap = umap_lib.UMAP(
        n_components=TARGET_N_DIMENSIONS,
        random_state=RANDOM_STATE,
        n_neighbors=UMAP_N_NEIGHBORS,
        min_dist=UMAP_MIN_DIST,
        metric=UMAP_METRIC
    )
    return umap.fit_transform(embeddings)


def create_clusters(reduced_embeddings: np.ndarray):
    logger.info("  -> Clustering via K-Means...")
    n_samples = reduced_embeddings.shape[0]
    n_clusters = min(CLUSTER_COUNT, max(n_samples, 1))
    kmeans = KMeans(n_clusters=n_clusters, random_state=RANDOM_STATE)
    return kmeans.fit_predict(reduced_embeddings)
