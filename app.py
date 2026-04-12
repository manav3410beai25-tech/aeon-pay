from openai import OpenAI
import sys

client = OpenAI(
  base_url = "https://integrate.api.nvidia.com/v1",
  api_key = "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"
)

# Keep track of conversation history
messages = [{"role": "system", "content": "You are a helpful AI assistant."}]

print("Chatbot initialized! Type 'quit' or 'exit' to stop.\n")

while True:
    try:
        user_input = input("You: ")
        if user_input.strip().lower() in ["quit", "exit"]:
            print("Goodbye!")
            break
        
        if not user_input.strip():
            continue

        messages.append({"role": "user", "content": user_input})
        
        # We keep the model you specified
        completion = client.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=messages,
            temperature=0.7,
            top_p=1,
            max_tokens=1024,
            stream=True
        )

        print("Bot: ", end="")
        full_response = ""

        for chunk in completion:
            if not getattr(chunk, "choices", None):
                continue
            
            # Print reasoning if the model supports it
            reasoning = getattr(chunk.choices[0].delta, "reasoning_content", None)
            if reasoning:
                print(reasoning, end="", flush=True)
            
            # Print standard content
            if chunk.choices and chunk.choices[0].delta.content is not None:
                content = chunk.choices[0].delta.content
                print(content, end="", flush=True)
                full_response += content
        
        print("\n")
        messages.append({"role": "assistant", "content": full_response})

    except KeyboardInterrupt:
        print("\nGoodbye!")
        break
    except Exception as e:
        print(f"\nAn error occurred: {e}")
        messages.pop()
