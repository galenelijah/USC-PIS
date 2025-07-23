from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from health_info.models import HealthCampaign, CampaignTemplate

User = get_user_model()


class Command(BaseCommand):
    help = 'Create active student-focused health campaigns'

    def handle(self, *args, **options):
        # Get admin user to create campaigns
        admin_user = User.objects.filter(role='ADMIN').first()
        if not admin_user:
            self.stdout.write(self.style.ERROR('No admin user found. Cannot create campaigns.'))
            return

        # Get campaign templates
        mental_health_template = CampaignTemplate.objects.filter(campaign_type='MENTAL_HEALTH').first()
        nutrition_template = CampaignTemplate.objects.filter(campaign_type='NUTRITION').first()
        hygiene_template = CampaignTemplate.objects.filter(campaign_type='HYGIENE').first()

        if not mental_health_template:
            self.stdout.write(self.style.ERROR('Mental health template not found. Run create_default_campaign_templates first.'))
            return

        # Current date for campaign scheduling
        now = timezone.now()
        
        student_campaigns = [
            {
                'template': mental_health_template,
                'title': 'Student Mental Health & Wellness Week',
                'summary': 'Take care of your mental health during the semester. Learn stress management techniques, discover campus resources, and prioritize your wellbeing.',
                'content': '''
                <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
                    <h2 style="color: #1976d2; text-align: center;">Student Mental Health & Wellness Week</h2>
                    <p style="font-size: 16px; text-align: center; color: #666;">Your mental health matters - especially during busy academic periods!</p>
                    
                    <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #1976d2;">🧠 Why Mental Health Matters for Students</h3>
                        <ul style="font-size: 14px;">
                            <li>Improves academic performance and focus</li>
                            <li>Helps manage stress during exams and deadlines</li>
                            <li>Builds resilience for future challenges</li>
                            <li>Enhances relationships with peers and family</li>
                        </ul>
                    </div>
                    
                    <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #388e3c;">💡 Quick Stress Relief Tips</h3>
                        <ul style="font-size: 14px;">
                            <li><strong>5-4-3-2-1 Technique:</strong> Name 5 things you see, 4 you hear, 3 you feel, 2 you smell, 1 you taste</li>
                            <li><strong>Power Nap:</strong> 15-20 minutes can refresh your mind</li>
                            <li><strong>Walk Outside:</strong> Fresh air and movement boost mood</li>
                            <li><strong>Connect:</strong> Call a friend or family member</li>
                            <li><strong>Breathe:</strong> Try 4-7-8 breathing (inhale 4, hold 7, exhale 8)</li>
                        </ul>
                    </div>
                    
                    <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #f57c00;">🏥 USC Campus Resources</h3>
                        <ul style="font-size: 14px;">
                            <li><strong>USC Health Center:</strong> Professional counseling services</li>
                            <li><strong>Student Support Services:</strong> Academic stress counseling</li>
                            <li><strong>Peer Counseling:</strong> Talk to trained student counselors</li>
                            <li><strong>Crisis Hotline:</strong> 24/7 support - Call (555) 123-4567</li>
                            <li><strong>Wellness Workshops:</strong> Free stress management sessions</li>
                        </ul>
                    </div>
                    
                    <div style="text-align: center; padding: 20px; background: #fce4ec; border-radius: 8px;">
                        <h3 style="color: #c2185b;">🚨 When to Seek Help</h3>
                        <p style="font-size: 14px;">If you experience persistent sadness, anxiety, sleep issues, or thoughts of self-harm, please reach out immediately. You are not alone!</p>
                        <p style="font-weight: bold; color: #d32f2f;">Emergency: Call 911 | Crisis Line: 988</p>
                    </div>
                </div>
                ''',
                'target_audience': 'USC Students - All Year Levels',
                'objectives': '''
                • Reduce mental health stigma among students
                • Increase awareness of campus mental health resources
                • Provide practical stress management strategies
                • Encourage help-seeking behavior
                • Support student academic success through wellness
                ''',
                'call_to_action': 'Take the first step: Practice one stress relief technique today and visit the USC Health Center to learn about counseling services.',
                'tags': 'mental health, student wellness, stress management, campus resources, counseling',
                'start_date': now,
                'end_date': now + timedelta(days=30),
                'featured_until': now + timedelta(days=14),
                'priority': 'HIGH'
            }
        ]

        if nutrition_template:
            student_campaigns.append({
                'template': nutrition_template,
                'title': 'Student Nutrition: Eating Well on a Budget',
                'summary': 'Learn how to maintain healthy eating habits while managing a student budget. Discover cheap, nutritious meal ideas and campus dining tips.',
                'content': '''
                <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
                    <h2 style="color: #388e3c; text-align: center;">Student Nutrition: Eating Well on a Budget</h2>
                    <p style="font-size: 16px; text-align: center; color: #666;">Fuel your studies with smart, affordable nutrition choices!</p>
                    
                    <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #2e7d32;">🥗 Budget-Friendly Superfoods</h3>
                        <ul style="font-size: 14px;">
                            <li><strong>Eggs:</strong> Complete protein, versatile, cheap (~$0.25 each)</li>
                            <li><strong>Bananas:</strong> Energy, potassium, portable (~$0.20 each)</li>
                            <li><strong>Oats:</strong> Fiber, energy, filling breakfast (~$0.15/serving)</li>
                            <li><strong>Sweet Potatoes:</strong> Vitamins, complex carbs (~$0.50 each)</li>
                            <li><strong>Beans:</strong> Protein, fiber, buy dried for savings</li>
                            <li><strong>Peanut Butter:</strong> Healthy fats, protein, long-lasting</li>
                        </ul>
                    </div>
                    
                    <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #f57c00;">⚡ Quick Student Meals (Under $3)</h3>
                        <ul style="font-size: 14px;">
                            <li><strong>Breakfast:</strong> Oatmeal + banana + peanut butter</li>
                            <li><strong>Lunch:</strong> Egg salad sandwich + fruit</li>
                            <li><strong>Dinner:</strong> Bean and sweet potato bowl</li>
                            <li><strong>Snack:</strong> Greek yogurt + berries</li>
                            <li><strong>Study Fuel:</strong> Trail mix (nuts + dried fruit)</li>
                        </ul>
                    </div>
                    
                    <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #1976d2;">🎒 Campus Dining Hacks</h3>
                        <ul style="font-size: 14px;">
                            <li>Load up on fruits and vegetables at the salad bar</li>
                            <li>Choose grilled over fried options</li>
                            <li>Drink water instead of sodas (save money & calories)</li>
                            <li>Take advantage of "all you can eat" responsibly</li>
                            <li>Ask about nutritional information at dining halls</li>
                        </ul>
                    </div>
                    
                    <div style="background: #fce4ec; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #c2185b;">📚 Exam Period Nutrition</h3>
                        <ul style="font-size: 14px;">
                            <li><strong>Brain Foods:</strong> Blueberries, nuts, dark chocolate</li>
                            <li><strong>Stay Hydrated:</strong> Dehydration affects concentration</li>
                            <li><strong>Regular Meals:</strong> Don't skip meals during stress</li>
                            <li><strong>Limit Caffeine:</strong> Too much can increase anxiety</li>
                            <li><strong>Prep Snacks:</strong> Have healthy options ready</li>
                        </ul>
                    </div>
                </div>
                ''',
                'target_audience': 'USC Students, especially those living on campus',
                'objectives': '''
                • Promote affordable healthy eating for students
                • Provide practical meal planning strategies
                • Increase awareness of campus nutrition resources
                • Support academic performance through proper nutrition
                • Address food insecurity among students
                ''',
                'call_to_action': 'Start this week: Plan one healthy, budget-friendly meal and visit the campus nutrition counselor for personalized advice.',
                'tags': 'nutrition, student budget, healthy eating, campus dining, meal planning',
                'start_date': now,
                'end_date': now + timedelta(days=45),
                'priority': 'MEDIUM'
            })

        if hygiene_template:
            student_campaigns.append({
                'template': hygiene_template,
                'title': 'Campus Health & Safety: Stay Healthy This Semester',
                'summary': 'Essential hygiene and health safety tips for campus life. Prevent illness and stay healthy during the academic year.',
                'content': '''
                <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
                    <h2 style="color: #1976d2; text-align: center;">Campus Health & Safety</h2>
                    <p style="font-size: 16px; text-align: center; color: #666;">Simple habits that keep you and your classmates healthy!</p>
                    
                    <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #2e7d32;">✋ Hand Hygiene Essentials</h3>
                        <ul style="font-size: 14px;">
                            <li><strong>Wash hands for 20+ seconds</strong> (sing "Happy Birthday" twice)</li>
                            <li><strong>Key times:</strong> Before eating, after bathroom, after coughing/sneezing</li>
                            <li><strong>Hand sanitizer:</strong> Use 60%+ alcohol when soap unavailable</li>
                            <li><strong>Avoid touching face</strong> with unwashed hands</li>
                            <li><strong>Campus stations:</strong> Hand sanitizer at all building entrances</li>
                        </ul>
                    </div>
                    
                    <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #f57c00;">🏠 Dorm & Shared Space Hygiene</h3>
                        <ul style="font-size: 14px;">
                            <li><strong>Clean surfaces regularly:</strong> Desks, door handles, light switches</li>
                            <li><strong>Don't share personal items:</strong> Toothbrushes, towels, drinks</li>
                            <li><strong>Wash bedding weekly</strong> in hot water</li>
                            <li><strong>Ventilate rooms</strong> - open windows when possible</li>
                            <li><strong>Disinfect commonly touched items</strong> like remotes, keyboards</li>
                        </ul>
                    </div>
                    
                    <div style="background: #fce4ec; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #c2185b;">🤧 When You're Feeling Sick</h3>
                        <ul style="font-size: 14px;">
                            <li><strong>Stay home/in dorm</strong> when you have fever or feel unwell</li>
                            <li><strong>Cover coughs and sneezes</strong> with your elbow, not hands</li>
                            <li><strong>Wear a mask</strong> if you must go out while sick</li>
                            <li><strong>Rest and hydrate</strong> - your body needs energy to heal</li>
                            <li><strong>Contact USC Health Center</strong> if symptoms worsen</li>
                        </ul>
                    </div>
                    
                    <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #1976d2;">💪 Boost Your Immune System</h3>
                        <ul style="font-size: 14px;">
                            <li><strong>Get 7-9 hours of sleep</strong> - crucial for immunity</li>
                            <li><strong>Exercise regularly</strong> - even 30 minutes helps</li>
                            <li><strong>Eat fruits and vegetables</strong> for vitamins and minerals</li>
                            <li><strong>Manage stress</strong> - chronic stress weakens immunity</li>
                            <li><strong>Stay hydrated</strong> - water helps your body function optimally</li>
                        </ul>
                    </div>
                </div>
                ''',
                'target_audience': 'All USC students, especially those in dormitories',
                'objectives': '''
                • Prevent spread of illness on campus
                • Promote good hygiene practices in shared spaces
                • Educate about immune system support
                • Reduce absenteeism due to preventable illness
                • Create a healthier campus environment
                ''',
                'call_to_action': 'Start today: Carry hand sanitizer, wash hands regularly, and practice good hygiene in shared spaces.',
                'tags': 'hygiene, campus health, illness prevention, immune system, dorm life',
                'start_date': now,
                'end_date': now + timedelta(days=60),
                'priority': 'HIGH'
            })

        # Create campaigns
        created_count = 0
        for campaign_data in student_campaigns:
            try:
                # Check if campaign with similar title already exists
                existing = HealthCampaign.objects.filter(title=campaign_data['title']).first()
                if existing:
                    self.stdout.write(self.style.WARNING(f'Campaign already exists: {campaign_data["title"]}'))
                    continue

                campaign = HealthCampaign.objects.create(
                    title=campaign_data['title'],
                    description=campaign_data['summary'],
                    campaign_type=campaign_data['template'].campaign_type,
                    priority=campaign_data['priority'],
                    content=campaign_data['content'],
                    summary=campaign_data['summary'],
                    target_audience=campaign_data['target_audience'],
                    objectives=campaign_data['objectives'],
                    call_to_action=campaign_data['call_to_action'],
                    tags=campaign_data['tags'],
                    start_date=campaign_data['start_date'],
                    end_date=campaign_data['end_date'],
                    featured_until=campaign_data.get('featured_until'),
                    status='ACTIVE',
                    template=campaign_data['template'],
                    created_by=admin_user
                )
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'✅ Created campaign: {campaign.title}'))
                
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'❌ Failed to create campaign {campaign_data["title"]}: {str(e)}'))

        self.stdout.write(
            self.style.SUCCESS(f'\n🎉 Successfully created {created_count} student-focused campaigns!')
        )
        
        if created_count > 0:
            self.stdout.write(
                self.style.SUCCESS(f'Students can now view these campaigns at /campaigns')
            )