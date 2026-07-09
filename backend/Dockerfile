FROM python:3.14-slim@sha256:b877e50bd90de10af8d82c57a022fc2e0dc731c5320d762a27986facfc3355c1

WORKDIR /src

COPY app app

COPY requirements.txt requirements.txt

RUN pip install --no-cache-dir --upgrade pip -r requirements.txt

# Switch to non-root user.
USER 10001

CMD ["python3", "app/main.py"]
