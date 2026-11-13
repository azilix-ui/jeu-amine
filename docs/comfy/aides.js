/* Aides pour piloter ComfyUI (PC du papa) depuis l'onglet http://127.0.0.1:8188 du navigateur intégré.
   À recoller dans l'onglet (javascript) si la page a été rechargée : elles disparaissent avec elle.
   __q(wf) : envoie un graphe ; __t2i(prompt, graine, préfixe, L, H) : FLUX.2 klein texte → image ;
   __edit([images], prompt, graine, préfixe, mp) : FLUX.2 klein retouche à partir d'images (ReferenceLatent) ;
   __assis(image, prompt, graine, préfixe) : Wan 2.2 image → vidéo (33 images, 2+2 étapes lightx2v), garde 3 images à partir de la 30e ;
   __fpb(description, bleu) : prompt « photo produit » sur fond vert (ou bleu) pour le détourage. */
window.__q = async (wf, front) => (await (await fetch('/prompt', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ prompt:wf, client_id:'claude', front:!!front }) })).json()).prompt_id;
window.__kbase = () => ({
  1:{ class_type:'UNETLoader', inputs:{ unet_name:'flux-2-klein-4b-fp8.safetensors', weight_dtype:'default' } },
  2:{ class_type:'CLIPLoader', inputs:{ clip_name:'qwen_3_4b.safetensors', type:'flux2' } },
  3:{ class_type:'VAELoader', inputs:{ vae_name:'flux2-vae.safetensors' } },
  8:{ class_type:'KSamplerSelect', inputs:{ sampler_name:'euler' } } });
window.__kfin = (w, pos, neg, W, H, seed, prefix) => {
  w[11] = { class_type:'EmptyFlux2LatentImage', inputs:{ width:W, height:H, batch_size:1 } };
  w[12] = { class_type:'Flux2Scheduler', inputs:{ steps:4, width:W, height:H } };
  w[13] = { class_type:'CFGGuider', inputs:{ model:['1', 0], positive:pos, negative:neg, cfg:1 } };
  w[14] = { class_type:'RandomNoise', inputs:{ noise_seed:seed } };
  w[15] = { class_type:'SamplerCustomAdvanced', inputs:{ noise:['14', 0], guider:['13', 0], sampler:['8', 0], sigmas:['12', 0], latent_image:['11', 0] } };
  w[16] = { class_type:'VAEDecode', inputs:{ samples:['15', 0], vae:['3', 0] } };
  w[17] = { class_type:'SaveImage', inputs:{ images:['16', 0], filename_prefix:prefix } }; return w; };
window.__t2i = (prompt, seed, prefix, W = 1024, H = 1024) => { const w = __kbase();
  w[7] = { class_type:'CLIPTextEncode', inputs:{ clip:['2', 0], text:prompt } }; w[9] = { class_type:'ConditioningZeroOut', inputs:{ conditioning:['7', 0] } };
  return __kfin(w, ['7', 0], ['9', 0], W, H, seed, prefix); };
window.__edit = (imgs, prompt, seed, prefix, mp = 1) => { const w = __kbase();
  w[7] = { class_type:'CLIPTextEncode', inputs:{ clip:['2', 0], text:prompt } }; w[9] = { class_type:'ConditioningZeroOut', inputs:{ conditioning:['7', 0] } };
  let pos = ['7', 0], neg = ['9', 0];
  imgs.forEach((im, k) => { const a = 20 + k * 10;
    w[a] = { class_type:'LoadImage', inputs:{ image:im } };
    w[a + 1] = { class_type:'ImageScaleToTotalPixels', inputs:{ image:[String(a), 0], upscale_method:'nearest-exact', megapixels:mp, resolution_steps:16 } };
    w[a + 2] = { class_type:'VAEEncode', inputs:{ pixels:[String(a + 1), 0], vae:['3', 0] } };
    w[a + 3] = { class_type:'ReferenceLatent', inputs:{ conditioning:pos, latent:[String(a + 2), 0] } };
    w[a + 4] = { class_type:'ReferenceLatent', inputs:{ conditioning:neg, latent:[String(a + 2), 0] } }; pos = [String(a + 3), 0]; neg = [String(a + 4), 0]; });
  w[10] = { class_type:'GetImageSize', inputs:{ image:['21', 0] } };
  __kfin(w, pos, neg, 0, 0, seed, prefix); w[11].inputs.width = ['10', 0]; w[11].inputs.height = ['10', 1]; w[12].inputs.width = ['10', 0]; w[12].inputs.height = ['10', 1]; return w; };
window.__fpb = (d, blue) => `Photorealistic studio product photo of ${d}, straight front view at eye level, the whole object fully visible and centered with margin around it, isolated on a flat uniform pure ${blue ? 'blue (#0000ff)' : 'green (#00ff00)'} background, soft even lighting, no shadow on the background, no text`;
window.__assis = (img, prompt, seed, prefix) => ({
  1:{ class_type:'UNETLoader', inputs:{ unet_name:'wan2.2_i2v_high_noise_14B_fp8_scaled.safetensors', weight_dtype:'default' } },
  2:{ class_type:'UNETLoader', inputs:{ unet_name:'wan2.2_i2v_low_noise_14B_fp8_scaled.safetensors', weight_dtype:'default' } },
  3:{ class_type:'LoraLoaderModelOnly', inputs:{ model:['1', 0], lora_name:'wan2.2_i2v_lightx2v_4steps_lora_v1_high_noise.safetensors', strength_model:1 } },
  4:{ class_type:'LoraLoaderModelOnly', inputs:{ model:['2', 0], lora_name:'wan2.2_i2v_lightx2v_4steps_lora_v1_low_noise.safetensors', strength_model:1 } },
  5:{ class_type:'ModelSamplingSD3', inputs:{ model:['3', 0], shift:5 } }, 6:{ class_type:'ModelSamplingSD3', inputs:{ model:['4', 0], shift:5 } },
  7:{ class_type:'CLIPLoader', inputs:{ clip_name:'umt5_xxl_fp8_e4m3fn_scaled.safetensors', type:'wan' } }, 8:{ class_type:'VAELoader', inputs:{ vae_name:'wan_2.1_vae.safetensors' } },
  9:{ class_type:'CLIPTextEncode', inputs:{ clip:['7', 0], text:prompt } },
  10:{ class_type:'CLIPTextEncode', inputs:{ clip:['7', 0], text:'blurry, distorted face, extra limbs, background change, camera movement, text' } },
  11:{ class_type:'LoadImage', inputs:{ image:img } },
  12:{ class_type:'WanImageToVideo', inputs:{ positive:['9', 0], negative:['10', 0], vae:['8', 0], width:480, height:832, length:33, batch_size:1, start_image:['11', 0] } },
  13:{ class_type:'KSamplerAdvanced', inputs:{ model:['5', 0], add_noise:'enable', noise_seed:seed, steps:4, cfg:1, sampler_name:'euler', scheduler:'simple', positive:['12', 0], negative:['12', 1], latent_image:['12', 2], start_at_step:0, end_at_step:2, return_with_leftover_noise:'enable' } },
  14:{ class_type:'KSamplerAdvanced', inputs:{ model:['6', 0], add_noise:'disable', noise_seed:seed, steps:4, cfg:1, sampler_name:'euler', scheduler:'simple', positive:['12', 0], negative:['12', 1], latent_image:['13', 0], start_at_step:2, end_at_step:10000, return_with_leftover_noise:'disable' } },
  15:{ class_type:'VAEDecode', inputs:{ samples:['14', 0], vae:['8', 0] } },
  16:{ class_type:'ImageFromBatch', inputs:{ image:['15', 0], batch_index:30, length:3 } },
  17:{ class_type:'SaveImage', inputs:{ images:['16', 0], filename_prefix:prefix } } });
'aides prêtes';
