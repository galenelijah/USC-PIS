from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from health_info.models import CampaignTemplate

User = get_user_model()


class Command(BaseCommand):
    help = 'Create default campaign templates for health campaigns'

    def handle(self, *args, **options):
        # Get or create admin user
        admin_user = User.objects.filter(role='ADMIN').first()
        if not admin_user:
            self.stdout.write(self.style.WARNING('No admin user found. Creating default admin.'))
            admin_user = User.objects.create_user(
                email='admin@usc.edu.ph',
                password='admin123',
                role='ADMIN',
                first_name='System',
                last_name='Administrator'
            )

        templates_data = [
            {
                'name': 'COVID-19 Vaccination Campaign',
                'description': 'Template for COVID-19 vaccination campaigns',
                'campaign_type': 'VACCINATION',
                'priority': 'HIGH',
                'title_template': 'COVID-19 Vaccination Drive - {date}',
                'content_template': '''
                <h2>COVID-19 Vaccination Campaign</h2>
                <p>The University of Southern California is conducting a COVID-19 vaccination drive to protect our campus community.</p>
                
                <h3>Why Get Vaccinated?</h3>
                <ul>
                    <li>Protect yourself and others from COVID-19</li>
                    <li>Help achieve community immunity</li>
                    <li>Safe and effective vaccines available</li>
                    <li>Free vaccination for all students and staff</li>
                </ul>
                
                <h3>Available Vaccines</h3>
                <ul>
                    <li>Pfizer-BioNTech</li>
                    <li>Moderna</li>
                    <li>Johnson & Johnson</li>
                </ul>
                
                <h3>Safety Information</h3>
                <p>All vaccines have been approved by the FDA and are safe and effective. Common side effects include mild pain at injection site, fatigue, and mild fever.</p>
                ''',
                'summary_template': 'Get vaccinated against COVID-19 to protect yourself and our campus community. Free vaccines available for all students and staff.',
                'target_audience_template': 'All USC students, faculty, and staff',
                'objectives_template': '''
                - Achieve 90% vaccination rate among campus community
                - Provide easy access to COVID-19 vaccines
                - Educate community about vaccine safety and effectiveness
                - Reduce COVID-19 transmission on campus
                ''',
                'call_to_action_template': 'Schedule your vaccination appointment today! Walk-ins welcome.',
                'tags_template': 'covid-19, vaccination, health, safety, campus, immunization'
            },
            {
                'name': 'Mental Health Awareness Campaign',
                'description': 'Template for mental health awareness and support campaigns',
                'campaign_type': 'MENTAL_HEALTH',
                'priority': 'HIGH',
                'title_template': 'Mental Health Awareness Week - {date}',
                'content_template': '''
                <h2>Mental Health Awareness Campaign</h2>
                <p>Your mental health matters. USC is committed to supporting the mental well-being of our entire campus community.</p>
                
                <h3>Signs to Watch For</h3>
                <ul>
                    <li>Persistent sadness or anxiety</li>
                    <li>Changes in sleep or appetite</li>
                    <li>Difficulty concentrating</li>
                    <li>Loss of interest in activities</li>
                    <li>Thoughts of self-harm</li>
                </ul>
                
                <h3>Available Resources</h3>
                <ul>
                    <li>USC Counseling Services</li>
                    <li>Peer support groups</li>
                    <li>Mental health workshops</li>
                    <li>24/7 crisis hotline</li>
                </ul>
                
                <h3>Self-Care Tips</h3>
                <ul>
                    <li>Maintain regular sleep schedule</li>
                    <li>Stay physically active</li>
                    <li>Connect with friends and family</li>
                    <li>Practice mindfulness and meditation</li>
                    <li>Seek professional help when needed</li>
                </ul>
                
                <h3>Crisis Resources</h3>
                <p><strong>USC Crisis Hotline:</strong> (555) 123-4567</p>
                <p><strong>National Suicide Prevention Lifeline:</strong> 988</p>
                ''',
                'summary_template': 'Take care of your mental health. Learn about resources, warning signs, and how to support yourself and others.',
                'target_audience_template': 'All USC students, faculty, and staff',
                'objectives_template': '''
                - Reduce stigma around mental health
                - Increase awareness of available resources
                - Provide practical self-care strategies
                - Encourage help-seeking behavior
                - Build a supportive campus community
                ''',
                'call_to_action_template': 'Reach out for support. You are not alone. Contact USC Counseling Services today.',
                'tags_template': 'mental health, awareness, counseling, support, wellness, self-care'
            },
            {
                'name': 'Nutrition & Wellness Campaign',
                'description': 'Template for nutrition and wellness campaigns',
                'campaign_type': 'NUTRITION',
                'priority': 'MEDIUM',
                'title_template': 'Healthy Eating Campaign - {date}',
                'content_template': '''
                <h2>Nutrition & Wellness Campaign</h2>
                <p>Fuel your body and mind with healthy nutrition choices. Learn how to maintain a balanced diet while managing your busy student life.</p>
                
                <h3>Healthy Eating Tips</h3>
                <ul>
                    <li>Eat a variety of fruits and vegetables</li>
                    <li>Choose whole grains over refined grains</li>
                    <li>Include lean proteins in your meals</li>
                    <li>Stay hydrated with water</li>
                    <li>Limit processed foods and added sugars</li>
                </ul>
                
                <h3>Budget-Friendly Nutrition</h3>
                <ul>
                    <li>Buy seasonal produce</li>
                    <li>Cook meals at home</li>
                    <li>Buy in bulk when possible</li>
                    <li>Use campus dining plans wisely</li>
                    <li>Plan meals ahead of time</li>
                </ul>
                
                <h3>Campus Resources</h3>
                <ul>
                    <li>Campus dining nutritional information</li>
                    <li>Nutrition counseling services</li>
                    <li>Campus farmers market</li>
                    <li>Cooking workshops</li>
                    <li>Food assistance programs</li>
                </ul>
                ''',
                'summary_template': 'Learn healthy eating habits that fit your student lifestyle. Discover budget-friendly nutrition tips and campus resources.',
                'target_audience_template': 'USC students, especially those living on campus',
                'objectives_template': '''
                - Promote healthy eating habits
                - Provide practical nutrition tips for students
                - Increase awareness of campus nutrition resources
                - Support students with food insecurity
                - Encourage cooking and meal planning skills
                ''',
                'call_to_action_template': 'Start your healthy eating journey today! Visit our nutrition resources page.',
                'tags_template': 'nutrition, wellness, healthy eating, diet, campus dining, food'
            },
            {
                'name': 'Hand Hygiene Campaign',
                'description': 'Template for hand hygiene and infection prevention campaigns',
                'campaign_type': 'HYGIENE',
                'priority': 'HIGH',
                'title_template': 'Hand Hygiene Campaign - {date}',
                'content_template': '''
                <h2>Hand Hygiene Campaign</h2>
                <p>Proper hand hygiene is one of the most effective ways to prevent the spread of infections. Keep yourself and others healthy with good hand hygiene practices.</p>
                
                <h3>When to Wash Your Hands</h3>
                <ul>
                    <li>Before eating or preparing food</li>
                    <li>After using the restroom</li>
                    <li>After coughing, sneezing, or blowing your nose</li>
                    <li>After touching surfaces in public areas</li>
                    <li>Before and after caring for someone who is sick</li>
                </ul>
                
                <h3>How to Wash Your Hands</h3>
                <ol>
                    <li>Wet your hands with clean water</li>
                    <li>Apply soap and lather well</li>
                    <li>Scrub for at least 20 seconds</li>
                    <li>Rinse thoroughly with clean water</li>
                    <li>Dry with a clean towel or air dry</li>
                </ol>
                
                <h3>Hand Sanitizer Guidelines</h3>
                <ul>
                    <li>Use alcohol-based sanitizer (at least 60% alcohol)</li>
                    <li>Apply to palm of one hand</li>
                    <li>Rub hands together until dry</li>
                    <li>Use when soap and water aren't available</li>
                </ul>
                
                <h3>Campus Hand Hygiene Stations</h3>
                <p>Hand sanitizer stations are located at all building entrances, cafeterias, libraries, and high-traffic areas.</p>
                ''',
                'summary_template': 'Practice good hand hygiene to prevent infections. Learn when and how to wash your hands effectively.',
                'target_audience_template': 'All USC campus community members',
                'objectives_template': '''
                - Promote proper hand hygiene practices
                - Reduce transmission of infectious diseases
                - Increase awareness of hand hygiene importance
                - Provide practical hand washing techniques
                - Support campus health and safety
                ''',
                'call_to_action_template': 'Wash your hands regularly and help keep our campus healthy!',
                'tags_template': 'hand hygiene, infection prevention, health, safety, campus, cleanliness'
            },
            {
                'name': 'Seasonal Flu Prevention Campaign',
                'description': 'Template for seasonal flu prevention and vaccination campaigns',
                'campaign_type': 'PREVENTION',
                'priority': 'MEDIUM',
                'title_template': 'Flu Prevention Campaign - {season} {year}',
                'content_template': '''
                <h2>Seasonal Flu Prevention Campaign</h2>
                <p>Protect yourself and others from seasonal flu. Get vaccinated and practice good health habits to stay healthy during flu season.</p>
                
                <h3>Why Get a Flu Shot?</h3>
                <ul>
                    <li>Reduces your risk of getting flu by 40-60%</li>
                    <li>Protects others in your community</li>
                    <li>Reduces severity if you do get sick</li>
                    <li>Helps prevent flu-related hospitalizations</li>
                </ul>
                
                <h3>Who Should Get Vaccinated?</h3>
                <ul>
                    <li>Everyone 6 months and older</li>
                    <li>Especially important for high-risk groups</li>
                    <li>Healthcare workers and students</li>
                    <li>People with chronic conditions</li>
                </ul>
                
                <h3>Flu Prevention Tips</h3>
                <ul>
                    <li>Get your annual flu vaccination</li>
                    <li>Wash hands frequently</li>
                    <li>Avoid touching your face</li>
                    <li>Stay home when sick</li>
                    <li>Cover coughs and sneezes</li>
                    <li>Maintain healthy lifestyle habits</li>
                </ul>
                
                <h3>Campus Flu Shot Locations</h3>
                <p>Free flu shots are available at:</p>
                <ul>
                    <li>USC Health Center</li>
                    <li>Campus pharmacy</li>
                    <li>Mobile vaccination clinics</li>
                </ul>
                ''',
                'summary_template': 'Get your flu shot and practice prevention strategies to stay healthy during flu season.',
                'target_audience_template': 'All USC students, faculty, and staff',
                'objectives_template': '''
                - Increase flu vaccination rates on campus
                - Reduce flu transmission and outbreaks
                - Educate about flu prevention strategies
                - Provide easy access to flu vaccines
                - Support campus health during flu season
                ''',
                'call_to_action_template': 'Get your flu shot today! Visit the Health Center or attend a vaccination clinic.',
                'tags_template': 'flu, prevention, vaccination, health, safety, seasonal, immunization'
            }
        ]

        created_count = 0
        for template_data in templates_data:
            template, created = CampaignTemplate.objects.get_or_create(
                name=template_data['name'],
                defaults={
                    **template_data,
                    'created_by': admin_user
                }
            )
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created template: {template.name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Template already exists: {template.name}')
                )

        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {created_count} campaign templates')
        )