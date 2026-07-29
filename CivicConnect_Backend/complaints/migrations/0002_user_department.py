from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("complaints", "0001_initial")]
    operations = [migrations.AddField(model_name="user", name="department", field=models.CharField(blank=True, choices=[("Road Department", "Road Department"), ("Sanitation Department", "Sanitation Department"), ("Electrical Department", "Electrical Department"), ("Water Department", "Water Department")], max_length=100))]
