import json
from django.core.management.base import BaseCommand
from quiz.models import Quiz, Question, QuestionOption


class Command(BaseCommand):
    help = "Load quiz data from JSON file"

    def add_arguments(self, parser):
        parser.add_argument(
            "json_file",
            type=str,
            help="Path to the JSON file containing quiz data"
        )

    def handle(self, *args, **options):
        json_file = options["json_file"]
        
        try:
            with open(json_file, "r", encoding="utf-8") as f:
                data = json.load(f)
        except FileNotFoundError:
            self.stdout.write(self.style.ERROR(f"File not found: {json_file}"))
            return
        except json.JSONDecodeError:
            self.stdout.write(self.style.ERROR(f"Invalid JSON file: {json_file}"))
            return
        
        # Create or get the quiz
        title = data.get("title", "Untitled Quiz")
        description = data.get("description", "")
        
        quiz, created = Quiz.objects.get_or_create(
            title=title,
            defaults={"description": description}
        )
        
        if created:
            self.stdout.write(self.style.SUCCESS(f"Created quiz: {title}"))
        else:
            self.stdout.write(self.style.WARNING(f"Quiz already exists: {title}"))
            # Ask if user wants to update
            response = input("Do you want to add more questions? (y/n): ")
            if response.lower() != "y":
                return
        
        # Load questions
        questions = data.get("questions", [])
        
        for idx, q_data in enumerate(questions):
            question_type = q_data.get("type", "mcq")
            question_text = q_data.get("question", "")
            explanation = q_data.get("explanation", "")
            options = q_data.get("options", [])
            answer_index = q_data.get("answer_index", 0)
            
            # Create question
            question, q_created = Question.objects.get_or_create(
                quiz=quiz,
                question_text=question_text,
                order=idx,
                defaults={
                    "question_type": question_type,
                    "explanation": explanation
                }
            )
            
            if q_created:
                self.stdout.write(f"  Created question {idx + 1}: {question_text[:50]}...")
            else:
                self.stdout.write(self.style.WARNING(f"  Question already exists: {question_text[:50]}..."))
                continue
            
            # Create options for multiple choice and true/false
            if question_type in ["mcq", "true_false"]:
                for opt_idx, option_text in enumerate(options):
                    is_correct = (opt_idx == answer_index)
                    
                    QuestionOption.objects.get_or_create(
                        question=question,
                        option_text=option_text,
                        order=opt_idx,
                        defaults={"is_correct": is_correct}
                    )
                    
                    if is_correct:
                        self.stdout.write(f"    • {option_text} [CORRECT]")
                    else:
                        self.stdout.write(f"    • {option_text}")
        
        self.stdout.write(self.style.SUCCESS(f"\nSuccessfully loaded {len(questions)} questions"))
