FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -i https://package-mirror.liara.ir/repository/pypi/simple -r requirements.txt

COPY ./app ./app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
