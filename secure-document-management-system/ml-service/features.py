"""
Shared feature schema for the anomaly detection models.

Every user "behavior snapshot" is reduced to this fixed-length numeric
feature vector before being fed into Isolation Forest / One-Class SVM.
Both training and serving (main.py) import FEATURE_NAMES from here so
they can never drift apart.
"""

FEATURE_NAMES = [
    "failed_logins_15m",       # failed login attempts in the last 15 minutes
    "downloads_10m",           # document downloads in the last 10 minutes
    "actions_30s",             # total actions (any type) in the last 30 seconds
    "unauthorized_attempts",   # unauthorized access attempts on record for this user
    "hour_of_day",             # 0-23, when the activity happened
]


def to_feature_vector(payload: dict):
    """Converts an incoming JSON payload (dict) into an ordered feature list."""
    return [float(payload.get(name, 0)) for name in FEATURE_NAMES]
