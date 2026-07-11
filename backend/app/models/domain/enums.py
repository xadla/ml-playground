from enum import StrEnum


class AlgorithmEnum(StrEnum):
    knn = "knn"
    logistic_regression = "logistic_regression"
    random_forest = "random_forest"
    decision_tree = "decision_tree"
    svm = "svm"


class DatasetTypeEnum(StrEnum):
    canvas = "canvas"
    uploaded = "uploaded"
    builtin = "builtin"


class ExperimentStatusEnum(StrEnum):
    pending = "pending"
    running = "running"
    completed = "completed"
    failed = "failed"
