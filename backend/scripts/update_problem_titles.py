"""Update problem titles for Easy difficulty problems from JSON files or description."""

import sys
import json
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.models.db import SessionLocal
from app.models.problem import Problem
from scripts.load_generated_problems import extract_title_from_description


def extract_better_title(description_md: str, function_signature: str) -> str:
    """Extract a concise title from description, preferring function name based titles."""
    # Extract function name first
    func_name = None
    if 'def ' in function_signature:
        func_name = function_signature.split('def ')[1].split('(')[0].strip()
    
    # If we have function name, try to create a meaningful title using function name and context
    if func_name:
        # Special handling for specific function names (check first, before general patterns)
        if func_name == 'calculate_grade':
            return f"등급 계산 함수 {func_name} 테스트"
        elif func_name == 'calculate_admission_fee':
            return f"입장료 계산 함수 {func_name} 테스트"
        elif func_name == 'calculate_shipping_fee':
            return f"배송비 계산 함수 {func_name} 테스트"
        elif func_name == 'normalize_us_phone':
            return f"전화번호 정규화 함수 {func_name} 테스트"
        
        # Look for keywords in description to create better title
        description_lower = description_md.lower()
        
        # Map function purpose keywords to title patterns
        if '검증' in description_md or 'validate' in description_lower or '유효' in description_md:
            if '이메일' in description_md or 'email' in description_lower:
                return f"이메일 검증 함수 {func_name} 테스트"
            elif '나이' in description_md or 'age' in description_lower:
                return f"나이 검증 함수 {func_name} 테스트"
            elif '비밀번호' in description_md or 'password' in description_lower:
                return f"비밀번호 검증 함수 {func_name} 테스트"
            elif '경로' in description_md or 'path' in description_lower:
                return f"파일 경로 검증 함수 {func_name} 테스트"
            elif '장바구니' in description_md or 'cart' in description_lower:
                return f"장바구니 검증 함수 {func_name} 테스트"
            else:
                return f"{func_name} 검증 함수 테스트"
        # Special handling for specific function names (check before general patterns)
        if func_name == 'calculate_grade':
            return f"등급 계산 함수 {func_name} 테스트"
        elif func_name == 'calculate_admission_fee':
            return f"입장료 계산 함수 {func_name} 테스트"
        elif func_name == 'calculate_shipping_fee':
            return f"배송비 계산 함수 {func_name} 테스트"
        elif func_name == 'normalize_us_phone':
            return f"전화번호 정규화 함수 {func_name} 테스트"
        elif '계산' in description_md or 'calculate' in description_lower:
            if '배송비' in description_md or 'shipping' in description_lower:
                return f"배송비 계산 함수 {func_name} 테스트"
            elif '입장료' in description_md or 'admission' in description_lower:
                return f"입장료 계산 함수 {func_name} 테스트"
            elif '등급' in description_md or 'grade' in description_lower:
                return f"등급 계산 함수 {func_name} 테스트"
            else:
                # For calculate functions, prefer "계산 함수" over "검증 함수"
                if func_name.startswith('calculate_'):
                    return f"{func_name} 계산 함수 테스트"
                return f"{func_name} 계산 함수 테스트"
        elif '변환' in description_md or 'convert' in description_lower or '정규화' in description_md or 'normalize' in description_lower:
            if '전화번호' in description_md or 'phone' in description_lower:
                return f"전화번호 정규화 함수 {func_name} 테스트"
            else:
                return f"{func_name} 변환 함수 테스트"
        elif '나누' in description_md or 'divide' in description_lower or '나눗셈' in description_md:
            return f"안전한 나눗셈 함수 {func_name} 테스트"
        # Special handling for specific function names
        elif func_name == 'calculate_grade':
            return f"등급 계산 함수 {func_name} 테스트"
        elif func_name == 'calculate_admission_fee':
            return f"입장료 계산 함수 {func_name} 테스트"
        elif func_name == 'calculate_shipping_fee':
            return f"배송비 계산 함수 {func_name} 테스트"
        elif func_name == 'normalize_us_phone':
            return f"전화번호 정규화 함수 {func_name} 테스트"
        elif '나누' in description_md or 'divide' in description_lower or '나눗셈' in description_md:
            return f"안전한 나눗셈 함수 {func_name} 테스트"
        else:
            # Generic function test title
            return f"{func_name} 함수 테스트"
    
    # Fallback: try to extract from description (first meaningful sentence, max 50 chars)
    lines = description_md.split('\n')
    
    for i, line in enumerate(lines):
        if '문제 설명' in line or '##' in line:
            for j in range(i + 1, min(i + 10, len(lines))):
                text = lines[j].strip()
                if not text or text.startswith('#'):
                    continue
                
                # Remove markdown formatting
                text = text.replace('**', '').replace('*', '').replace('`', '').strip()
                
                # Extract first sentence (max 50 characters)
                for end_char in ['.', '!', '?', '다', '니다', '습니다']:
                    if end_char in text:
                        idx = text.find(end_char)
                        if idx > 0:
                            title = text[:idx + len(end_char)].strip()
                            if len(title) > 50:
                                # Try to find a better break point
                                for break_char in [',', ':', ';', '에서', '는', '을', '를']:
                                    if break_char in title[:40]:
                                        break_idx = title.rfind(break_char, 0, 40)
                                        if break_idx > 15:
                                            title = title[:break_idx + len(break_char)].strip()
                                            break
                                if len(title) > 50:
                                    title = title[:47].strip() + "..."
                            if title and len(title) >= 10:
                                return title
                
                # If no sentence ending, use first 50 chars
                if len(text) >= 10:
                    title = text[:50].strip()
                    if len(text) > 50:
                        title += "..."
                    return title
    
    return "문제"


def update_easy_problem_titles():
    """Update titles for Easy difficulty problems."""
    script_dir = Path(__file__).parent.parent
    generated_dir = script_dir / "generated_problems"
    
    if not generated_dir.exists():
        print(f"❌ 디렉토리를 찾을 수 없습니다: {generated_dir}")
        return
    
    json_files = sorted(generated_dir.glob("*.json"))
    
    if not json_files:
        print(f"❌ JSON 파일을 찾을 수 없습니다: {generated_dir}")
        return
    
    print(f"📁 {len(json_files)}개의 JSON 파일 발견")
    print("=" * 60)
    
    db: Session = SessionLocal()
    try:
        updated_count = 0
        not_found_count = 0
        skipped_count = 0
        
        for json_file in json_files:
            problem_id = json_file.stem  # E01, E02, VE01, etc.
            slug = f"problem-{problem_id.lower()}"
            
            # Load JSON file
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Find problem in database
            problem = db.query(Problem).filter(Problem.slug == slug).first()
            if not problem:
                print(f"❌ {problem_id} ({slug}) - 데이터베이스에서 찾을 수 없음")
                not_found_count += 1
                continue
            
            # Only update Easy difficulty problems
            if problem.difficulty != "Easy":
                print(f"⏭️  {problem_id} ({slug}) - 난이도가 Easy가 아님 ({problem.difficulty}), 건너뜀")
                skipped_count += 1
                continue
            
            # Get title from JSON first, if not available extract from description
            title = data.get('title')
            if not title:
                # Extract better title from description
                title = extract_better_title(
                    data.get('description_md', ''),
                    data.get('function_signature', '')
                )
                print(f"📝 {problem_id} ({slug}) - JSON에 title이 없어 description에서 추출: '{title}'")
            else:
                # Even if JSON has title, check if current title is too long and needs update
                current_title = problem.title
                if len(current_title) > 100 or (not current_title or current_title == "문제"):
                    # Current title is too long or invalid, use better extraction
                    better_title = extract_better_title(
                        data.get('description_md', ''),
                        data.get('function_signature', '')
                    )
                    if better_title and len(better_title) < len(current_title):
                        title = better_title
                        print(f"📝 {problem_id} ({slug}) - 현재 타이틀이 너무 길어서 개선: '{title}'")
            
            # Always update if title is different or current title is too long
            should_update = (
                problem.title != title or 
                len(problem.title) > 100 or
                not problem.title or
                problem.title == "문제"
            )
            
            if should_update:
                print(f"🔄 {problem_id} ({slug})")
                print(f"   이전: '{problem.title}'")
                print(f"   새:   '{title}'")
                problem.title = title
                updated_count += 1
            else:
                print(f"✓ {problem_id} ({slug}) - 이미 올바른 타이틀: '{title}'")
        
        db.commit()
        
        print("=" * 60)
        print(f"✅ 완료! (업데이트: {updated_count}, 찾을 수 없음: {not_found_count}, 건너뜀: {skipped_count})")
        
    except Exception as e:
        db.rollback()
        print(f"❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    try:
        update_easy_problem_titles()
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)

