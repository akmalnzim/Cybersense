from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import torch
from torch import nn
from transformers import BertTokenizer, BertModel

# Initialize FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define BERTClassifier with the same architecture used during training
class BERTClassifier(nn.Module):
    def __init__(self, bert_model_name, num_classes):
        super(BERTClassifier, self).__init__()
        self.bert = BertModel.from_pretrained(bert_model_name, output_attentions=True)
        self.dropout = nn.Dropout(0.1)
        self.fc = nn.Linear(self.bert.config.hidden_size, num_classes)

    def forward(self, input_ids, attention_mask):
        outputs = self.bert(input_ids, attention_mask=attention_mask)
        pooled_output = outputs.pooler_output
        x = self.dropout(pooled_output)
        logits = self.fc(x)
        return logits, outputs.attentions  # Return logits and attentions
    
# Load the model and tokenizer
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = BERTClassifier('bert-base-uncased', num_classes=6).to(device)
model.load_state_dict(torch.load("cyberbullying_model.pth", map_location=device))
model.eval()
tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
classes = ["age", "ethnicity", "gender", "not_cyberbullying", "other_cyberbullying", "religion"]

class TextRequest(BaseModel):
    text: str

# Updated prediction function
def predict_class(text, model, tokenizer, device, classes, max_length=128):
    model.eval()
    encoding = tokenizer(
        text,
        return_tensors='pt',
        max_length=max_length,
        padding='max_length',
        truncation=True
    )
    input_ids = encoding['input_ids'].to(device)
    attention_mask = encoding['attention_mask'].to(device)

    with torch.no_grad():
        logits, attentions = model(input_ids=input_ids, attention_mask=attention_mask)  # Get logits and attentions
        _, preds = torch.max(logits, dim=1)

    predicted_class = classes[preds.item()]

    tokens = tokenizer.convert_ids_to_tokens(input_ids[0])
    if attentions:
        last_layer_attention = attentions[-1] 
        attention_scores = last_layer_attention.mean(dim=1)
        word_importances = attention_scores[0, :, :].sum(dim=0).cpu().tolist()
    else:
        word_importances = [0] * len(tokens)

    words_and_importances = [(word, score) for word, score in zip(tokens, word_importances)]
    words_and_importances = sorted(words_and_importances, key=lambda x: x[1], reverse=True)
    influential_words = [word for word, score in words_and_importances if word not in ['[CLS]', '[SEP]', '[PAD]'] and score > 0]

    return predicted_class, influential_words

@app.post("/predict")
async def predict(request: TextRequest):
    text = request.text
    predicted_class, influential_words = predict_class(text, model, tokenizer, device, classes)
    return {"class": predicted_class, "influential_words": influential_words}

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='localhost', port=8000)