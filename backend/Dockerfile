FROM python:3.14-slim@sha256:4ed33101ee7ec299041cc41dd268dae17031184be94384b1ce7936dc4e5dead3

WORKDIR /src

COPY app app

COPY requirements.txt requirements.txt

RUN pip install --no-cache-dir --upgrade pip -r requirements.txt

# Switch to non-root user.
USER 10001

CMD ["python3", "app/main.py"]
