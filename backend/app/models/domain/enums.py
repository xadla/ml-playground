from enum import Enum


class AlgorithmEnum(str, Enum):
    knn = "knn"
    logistic_regression = "logistic_regression"
    random_forest = "random_forest"
    decision_tree = "decision_tree"
    svm = "svm"


class DatasetTypeEnum(str, Enum):
    canvas = "canvas"
    uploaded = "uploaded"
    builtin = "builtin"


class ExperimentStatusEnum(str, Enum):
    pending = "pending"
    running = "running"
    completed = "completed"
    failed = "failed"
