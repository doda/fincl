from datetime import datetime
from django import forms
from django.contrib.admin.widgets import AdminSplitDateTime
from django.forms import BaseFormSet, formset_factory

from bootstrap4.widgets import RadioSelectButtonGroup

RADIO_CHOICES = (("1", "Radio 1"), ("2", "Radio 2"))


MEDIA_CHOICES = (
    ("Audio", (("vinyl", "Vinyl"), ("cd", "CD"))),
    ("Video", (("vhs", "VHS Tape"), ("dvd", "DVD"))),
    ("unknown", "Unknown"),
)

TICKER_CHOICES = (("spy", "SPY"), )
BAR_TYPE_CHOICES = (("volume", "Volume Bars"), ("dollar", "Dollar Bars") )
DOWNSAMPLING_CHOICES = (("none", "None"), ("cusum", "CUSUM"))
BINARIZE_CHOICES = (("triple_barrier_method", "Triple-Barrier method"), ("fixed_horizon", "Fixed Horizon"))
TRANSFORM_CHOICES = (("returns", "Returns"), ("log", "Log prices"), ("fracdiff", "Fractionally Differentiated prices"))
PROCEDURE_CHOICES = (("simple", "Simple split"), ("walk_forward", "Walk Forward Cross-validation"), ("cpcv", "Combinatorial Purged Cross-validation"))
ALPHA_CHOICES = (("ma_crossover", "MA Crossover"), )
CLASSIFIER_CHOICES = (("random_forest", "Random Forest"), ("xgb", "XGBoost"), ("lgbm", "LightGBM"))
REPORT_CHOICES = (("classification", "Classification Report"), ("pnl", "PnL"), )
USE_METALABELING_CHOICES =  ((True, "Yes"), (False, "No"), )

METAL_INITIAL = {
    'ticker': TICKER_CHOICES[0][0],
    'bar_type': BAR_TYPE_CHOICES[0][0],
    'bar_size': 100000000,
    'downsampling': DOWNSAMPLING_CHOICES[0][0],
    'binarize': BINARIZE_CHOICES[1][0],
    'binarize_window': 20,
    'transform': TRANSFORM_CHOICES[0][0],
    'test_procedure': PROCEDURE_CHOICES[0][0],
    'alpha': ALPHA_CHOICES[0][0],
    'classifier': CLASSIFIER_CHOICES[0][0],
    'use_metalabeling': True,
    'start_year': 2000,
    'end_year': datetime.utcnow().year,
}

class MetalForm(forms.Form):
    """Form with a variety of widgets to test bootstrap4 rendering."""
    ticker = forms.ChoiceField(choices=TICKER_CHOICES, widget=forms.RadioSelect)
    start_year = forms.IntegerField()
    end_year = forms.IntegerField()
    bar_type = forms.ChoiceField(choices=BAR_TYPE_CHOICES)
    bar_size = forms.IntegerField()
    downsampling = forms.ChoiceField(choices=DOWNSAMPLING_CHOICES)
    binarize = forms.ChoiceField(choices=BINARIZE_CHOICES)
    binarize_window = forms.IntegerField()
    transform = forms.ChoiceField(choices=TRANSFORM_CHOICES)
    alpha = forms.ChoiceField(choices=ALPHA_CHOICES)
    use_metalabeling = forms.BooleanField()
    classifier = forms.ChoiceField(choices=CLASSIFIER_CHOICES)
    test_procedure = forms.ChoiceField(choices=PROCEDURE_CHOICES)
    report = forms.ChoiceField(choices=REPORT_CHOICES)


    required_css_class = "bootstrap4-req"

    # Set this to allow tests to work properly in Django 1.10+
    # More information, see issue #337
    use_required_attribute = False

    def clean(self):
        cleaned_data = super().clean()

        if len(cleaned_data.keys()) != len(self.base_fields):
            raise forms.ValidationError("Specify everything pls.")
        return cleaned_data



class TestForm(forms.Form):
    """Form with a variety of widgets to test bootstrap4 rendering."""

    date = forms.DateField(required=False)
    datetime = forms.SplitDateTimeField(widget=AdminSplitDateTime(), required=False)
    subject = forms.CharField(
        max_length=100,
        help_text="my_help_text",
        required=True,
        widget=forms.TextInput(attrs={"placeholder": "placeholdertest"}),
    )
    xss_field = forms.CharField(label='XSS" onmouseover="alert(\'Hello, XSS\')" foo="', max_length=100)
    password = forms.CharField(widget=forms.PasswordInput)
    message = forms.CharField(required=False, help_text="<i>my_help_text</i>")
    sender = forms.EmailField(label="Sender © unicode", help_text='E.g., "me@example.com"')
    secret = forms.CharField(initial=42, widget=forms.HiddenInput)
    cc_myself = forms.BooleanField(
        required=False, help_text='cc stands for "carbon copy." You will get a copy in your mailbox.'
    )
    select1 = forms.ChoiceField(choices=RADIO_CHOICES)
    select2 = forms.MultipleChoiceField(choices=RADIO_CHOICES, help_text="Check as many as you like.")
    select3 = forms.ChoiceField(choices=MEDIA_CHOICES)
    select4 = forms.MultipleChoiceField(choices=MEDIA_CHOICES, help_text="Check as many as you like.")
    category1 = forms.ChoiceField(choices=RADIO_CHOICES, widget=forms.RadioSelect)
    category2 = forms.MultipleChoiceField(
        choices=RADIO_CHOICES, widget=forms.CheckboxSelectMultiple, help_text="Check as many as you like."
    )
    category3 = forms.ChoiceField(widget=forms.RadioSelect, choices=MEDIA_CHOICES)
    category4 = forms.MultipleChoiceField(
        choices=MEDIA_CHOICES, widget=forms.CheckboxSelectMultiple, help_text="Check as many as you like."
    )
    category5 = forms.ChoiceField(widget=RadioSelectButtonGroup, choices=MEDIA_CHOICES)
    addon = forms.CharField(widget=forms.TextInput(attrs={"addon_before": "before", "addon_after": "after"}))

    required_css_class = "bootstrap4-req"

    # Set this to allow tests to work properly in Django 1.10+
    # More information, see issue #337
    use_required_attribute = False

    def clean(self):
        cleaned_data = super().clean()
        raise forms.ValidationError("This error was added to show the non field errors styling.")
        return cleaned_data


class ContactForm(TestForm):
    pass


class ContactBaseFormSet(BaseFormSet):
    def add_fields(self, form, index):
        super().add_fields(form, index)

    def clean(self):
        super().clean()
        raise forms.ValidationError("This error was added to show the non form errors styling")


ContactFormSet = formset_factory(TestForm, formset=ContactBaseFormSet, extra=2, max_num=4, validate_max=True)


class FilesForm(forms.Form):
    text1 = forms.CharField()
    file1 = forms.FileField()
    file2 = forms.FileField(required=False)
    file3 = forms.FileField(widget=forms.ClearableFileInput)
    file5 = forms.ImageField()
    file4 = forms.FileField(required=False, widget=forms.ClearableFileInput)


class ArticleForm(forms.Form):
    title = forms.CharField()
    pub_date = forms.DateField()

    def clean(self):
        cleaned_data = super().clean()
        raise forms.ValidationError("This error was added to show the non field errors styling.")
        return cleaned_data
