# backend/musicgen.py

from transformers import AutoProcessor, MusicgenForConditionalGeneration
import scipy.io.wavfile
import torch

class MusicGenerator:
    def __init__(self):
        self.processor = AutoProcessor.from_pretrained("facebook/musicgen-small")
        self.model = MusicgenForConditionalGeneration.from_pretrained("facebook/musicgen-small")

    def generate_music(self, prompt=None, output_path="musicgen_out.wav"):
        if not prompt:
            raise ValueError("프롬프트가 필요합니다.")
        
        inputs = self.processor(
            text=[prompt],
            padding=True,
            return_tensors="pt",
        )
        
        # 모델을 평가 모드로 설정
        self.model.eval()
        
        with torch.no_grad():
            audio_values = self.model.generate(**inputs, do_sample=True, guidance_scale=3, max_new_tokens=256)
        
        sampling_rate = self.model.config.audio_encoder.sampling_rate
        scipy.io.wavfile.write(output_path, rate=sampling_rate, data=audio_values[0, 0].numpy())
        
        return output_path
