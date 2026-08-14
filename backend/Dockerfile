FROM python:3.14-slim@sha256:a7fb1e634c4a578f9e0bd6327f11a3cde11b7a9395f48e24360c0988bcc5c2bc

WORKDIR /src

COPY app app

COPY requirements.txt requirements.txt

RUN pip install --no-cache-dir --upgrade pip -r requirements.txt

# Switch to non-root user.
USER 10001

CMD ["python3", "app/main.py"]
