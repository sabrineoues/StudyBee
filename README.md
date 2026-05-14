# 🐝 StudyBee — Intelligent Multimodal Assistant for Emotion-Aware Learning

StudyBee is an adaptive learning platform that combines AI-driven document analysis, conversational assistance, and real-time emotion and biosensor recognition to personalize the student experience.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [System Architecture](#system-architecture)
- [Modules](#modules)
  - [Facial Emotion Recognition](#1-facial-emotion-recognition)
  - [Wearable Physiological Signal Detection](#2-wearable-physiological-signal-detection)
  - [Automatic Quiz Generation](#3-automatic-quiz-generation-from-pdfs)
  - [RAG-Based Chatbot](#4-rag-based-chatbot)
  - [Buzzy Avatar](#5-buzzy-avatar)
  - [Text-Based Emotion and Physical State Classification](#6-text-based-emotion--physical-state-classification)
  - [PPO-Based Adaptive Difficulty Controller](#7-ppo-based-adaptive-difficulty-controller)
  - [Speech Emotion Recognition](#8-speech-emotion-recognition-ravdess)
  - [Personalised Pomodoro Duration Prediction](#9-personalised-pomodoro-duration-prediction)
- [Tech Stack](#tech-stack)
- [Datasets](#datasets)
- [Installation](#installation)
- [Project Structure](#project-structure)
- [Team](#team)

---

## Overview

Modern students face increasing challenges managing time, processing complex content, and maintaining emotional well-being. Existing tools often treat all learners uniformly and ignore how a student's capacity to learn shifts depending on emotional, cognitive, and physiological state.

StudyBee bridges this gap by integrating:

- Document analysis for PDF parsing, summarization, and quiz generation
- Conversational AI with a retrieval-augmented chatbot and an adaptive avatar
- Multimodal emotion recognition through text, speech, facial cues, and biosignals
- Adaptive learning that can adjust difficulty and Pomodoro length based on user state

---

## Features

| Feature | Description |
|---|---|
| Facial Emotion Recognition | Real-time detection of facial emotions during study sessions |
| Physiological Sensing | BPM and SpO2 monitoring from an Arduino MAX30102 biosensor workflow |
| Quiz Generation | Automatic quiz creation from uploaded PDFs |
| RAG Chatbot | Document-grounded Q&A with workflow and diagram support |
| Buzzy Avatar | Emotionally adaptive conversational agent with animated feedback |
| Text Classification | Emotion and physical state inference from free-form text |
| Adaptive Difficulty | Reinforcement learning for task difficulty adjustment |
| Speech Emotion Recognition | Emotion classification from spoken input |
| Pomodoro Prediction | Personalized focus session duration prediction |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                           StudyBee                               │
│                                                                  │
│  Frontend: React                                                  │
│                                                                  │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐      │
│  │  RAG Chatbot │   │ Buzzy Avatar │   │ Adaptive Engine  │      │
│  └──────────────┘   └──────────────┘   └──────────────────┘      │
│                                                                  │
│  Backend: Django REST Framework                                   │
│                                                                  │
│  ┌──────────────┐   ┌──────────────┐                              │
│  │ PostgreSQL   │   │  ChromaDB    │                              │
│  │ relational   │   │  vectors     │                              │
│  └──────────────┘   └──────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Modules

### 1. Facial Emotion Recognition

Detects and classifies facial emotions in real time during study sessions.

- Dataset: FER-2013
- Model: CNN-based emotion classifier
- Output: Angry, Disgust, Fear, Happy, Neutral, Sad, Surprise

### 2. Wearable Physiological Signal Detection

Uses wearable-style biosensor data to estimate student state.

- Sensor workflow: Arduino MAX30102 pulse oximeter
- Signals: BPM and SpO2
- Backend exposure: Django API endpoints for current and historical values

### 3. Automatic Quiz Generation from PDFs

Converts PDF documents into interactive quizzes and practice questions.

- PDF parsing and text extraction
- Question generation and validation
- Export to structured formats

### 4. RAG-Based Chatbot

Retrieval-augmented chatbot for academic document comprehension.

- Grounded responses from uploaded content
- Search over session-specific document collections
- Support for summaries, answers, and generated workflows

### 5. Buzzy Avatar

Emotionally aware conversational interface with animated response delivery.

- Speech interaction
- Adaptive tone and output style
- Avatar-driven user experience

### 6. Text-Based Emotion and Physical State Classification

Predicts user state from free-form input text.

- Emotion detection
- Physical state inference
- Multilingual model support

### 7. PPO-Based Adaptive Difficulty Controller

Reinforcement learning agent that keeps tasks aligned with the user's current ability.

- Difficulty adjustment based on performance
- Reward shaping from accuracy, speed, and stability
- Per-user adaptation over time

### 8. Speech Emotion Recognition (RAVDESS)

Classifies emotion from spoken input.

- Speech feature extraction
- Sequence modeling for emotion classes
- Useful for multimodal feedback loops

### 9. Personalised Pomodoro Duration Prediction

Predicts an optimal Pomodoro length from user activity and wellness signals.

- Adaptive session duration
- Personalized study recommendations
- Designed to reduce fatigue and improve focus

---

## Tech Stack

### Backend

| Tool | Purpose |
|---|---|
| Python / Django REST Framework | API layer |
| PostgreSQL | Relational persistence |
| ChromaDB | Vector search for retrieval use cases |
| PyTorch | Deep learning models |
| Hugging Face Transformers | NLP and classification models |
| PySerial | Arduino serial communication |

### Frontend

| Tool | Purpose |
|---|---|
| React | User interface |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| Framer Motion | Motion and animation |

### AI / ML

| Tool | Purpose |
|---|---|
| TensorFlow / Keras | Neural network training |
| scikit-learn | Classical ML pipelines |
| SHAP | Model explainability |
| NLTK / spaCy | NLP preprocessing |

---

## Datasets

| Dataset | Task | Size |
|---|---|---|
| FER-2013 | Facial emotion recognition | 35,887 images |
| WESAD | Wearable affect detection | Multimodal biosignals |
| RAVDESS | Speech emotion recognition | Audio emotion recordings |
| StudentLife | Pomodoro duration prediction | Longitudinal student activity data |

---

## Installation

```bash
git clone <your-repository-url>
cd StudyBee-integration_chatbot
```

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
pip install pyserial==3.5
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

### Arduino Biosensor Reader

```bash
cd backend
python manage.py start_bio_sensor_reader --port COM4 --baudrate 115200
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

> Configure any required environment variables before running the full stack.

---

## Project Structure

```
StudyBee-integration_chatbot/
├── backend/
├── frontend/
├── ai_services/
├── fusion_services/
├── mobile_flutter/
├── BIOSENSOR_QUICKSTART.md
├── ARDUINO_BIOSENSOR_SETUP.md
├── requirement.txt
└── README.md
```

---

## Team

StudyBee Group

---

StudyBee is an academic project exploring the intersection of affective computing and adaptive educational technology.
