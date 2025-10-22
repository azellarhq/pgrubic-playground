FROM python:3.14-slim@sha256:79eaa9622e4daa24b775ac2c9b6dc49b4f302ce925e3dcf1851782b9c93cf5f5

WORKDIR /src

COPY app app

COPY requirements.txt requirements.txt

RUN pip install --no-cache-dir --upgrade pip -r requirements.txt

# Switch to non-root user.
USER 10001

CMD ["python3", "app/main.py"]
