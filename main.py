from fastapi import FastAPI
import pandas as pd
from pydantic import BaseModel , Field
import joblib
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins = ["*"],
    allow_methods = ["*"],
    allow_headers = ["*"],
)


columns = ['latitude', 'longitude', 'price', 'minimum_nights', 'number_of_reviews', 'reviews_per_month',
              'calculated_host_listings_count', 'availability_365', 'neighbourhood_group', 'neighbourhood']

model = joblib.load("Model_pipeline.pkl")



#pydantic model = the input validation
class Features(BaseModel):
    latitude : float = Field(...,ge=-90,le=90,description="Latitude must be between -90 and 90")
    longitude : float = Field(...,ge=-180,le=180,description = "Longitude Coordinate")
    price : float = Field(...,ge=0,description = "price per night, must be positive")
    minimum_nights : int = Field(...,ge=1,description = "minimum nights requied for booking")
    number_of_reviews : int = Field(...,ge=0,description = "Total Number of reviews")
    reviews_per_month : float = Field(..., ge=0,description = "Average reviews per month")
    calculated_host_listings_count : int = Field(...,ge=0,desciption = "Number of listing by this host")
    availability_365 : int = Field(...,ge=0,le=365,description = "Days available out of 365")
    neighbourhood_group : str = Field(...,min_length=1,description = "Borough or neighbourhood group")
    neighbourhood : str = Field(...,min_length = 1, description = "specific neighbourhood name")

                                      



@app.get('/')
def greet():
    return "Hello Guyss"

@app.post('/predict')
def predict(features: Features):
    row = pd.DataFrame([features.dict()], columns = columns)
    prediction = model.predict(row)
    probability = model.predict_proba(row)
    return {
        "prediction_room_type": prediction[0],
        "probability": probability.tolist()[0]
    }
